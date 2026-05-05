import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Chunk, Question, Quiz
from app.llm.claude import DEFAULT_MODEL, get_client

DEFAULT_THRESHOLD = 0.7
DEFAULT_MAX_TOKENS = 4096

SYSTEM_PROMPT = """당신은 객관식 학습 문제의 품질을 평가하는 검토자입니다.

각 문제를 자료(원문)와 대조하여 다음 기준으로 0.0~1.0 점수를 매기세요:

1. correctness: 정답이 자료에 명확히 근거하는가?
2. distractor_quality: 오답이 자료와 모순되거나 자료에 없는 내용인가? (정답과 동일하거나 너무 동떨어지면 감점)
3. clarity: 문제가 한 가지로 명확히 해석되는가? (모호성/이중 해석 시 감점)
4. groundedness: 자료 외 외부 지식에 의존하지 않는가?

overall은 위 네 점수를 종합한 0.0~1.0 점수입니다.
단순 평균이 아니어도 됩니다 — 치명적 결함(예: 자료에 없는 정답, 오답 중 정답 가능)이 있으면 크게 감점하세요.

comment에는 점수의 근거를 한국어로 간결히 적으세요."""


VALIDATION_TOOL = {
    "name": "submit_validation",
    "description": "각 문제의 검증 결과를 제출합니다.",
    "input_schema": {
        "type": "object",
        "properties": {
            "results": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question_id": {"type": "string", "description": "입력으로 받은 question_id"},
                        "correctness": {"type": "number", "minimum": 0, "maximum": 1},
                        "distractor_quality": {"type": "number", "minimum": 0, "maximum": 1},
                        "clarity": {"type": "number", "minimum": 0, "maximum": 1},
                        "groundedness": {"type": "number", "minimum": 0, "maximum": 1},
                        "overall": {"type": "number", "minimum": 0, "maximum": 1},
                        "comment": {"type": "string"},
                    },
                    "required": [
                        "question_id",
                        "correctness",
                        "distractor_quality",
                        "clarity",
                        "groundedness",
                        "overall",
                        "comment",
                    ],
                },
            }
        },
        "required": ["results"],
    },
}


def _build_prompt(questions: list[Question], chunk_map: dict[uuid.UUID, str]) -> str:
    parts: list[str] = ["=== 자료 ==="]
    for cid, content in chunk_map.items():
        parts.append(f"\n[chunk_id: {cid}]")
        parts.append(content)
    parts.append("\n=== 검토할 문제 ===")
    for q in questions:
        parts.append(f"\n[question_id: {q.id}]")
        parts.append(f"질문: {q.question_text}")
        for i, choice in enumerate(q.choices):
            marker = " ← 정답" if i == q.answer_index else ""
            parts.append(f"  {chr(65 + i)}) {choice}{marker}")
        if q.explanation:
            parts.append(f"해설: {q.explanation}")
        if q.source_chunk_ids:
            parts.append(f"근거 청크: {[str(cid) for cid in q.source_chunk_ids]}")
    parts.append("\n위 자료와 대조하여 각 문제를 평가하고 submit_validation 도구로 결과를 제출하세요.")
    return "\n".join(parts)


def _extract_results(response) -> list[dict]:
    for block in response.content:
        if getattr(block, "type", None) == "tool_use" and block.name == "submit_validation":
            return block.input.get("results", [])
    raise RuntimeError("Claude가 submit_validation 도구를 호출하지 않았습니다")


def _clamp(x: float) -> float:
    return max(0.0, min(1.0, x))


def validate_quiz(db: Session, quiz: Quiz, threshold: float = DEFAULT_THRESHOLD) -> Quiz:
    if not quiz.questions:
        quiz.status = "validated"
        db.commit()
        db.refresh(quiz)
        return quiz

    chunk_ids: set[uuid.UUID] = set()
    for q in quiz.questions:
        for cid in q.source_chunk_ids:
            chunk_ids.add(cid)

    if chunk_ids:
        chunks = db.execute(select(Chunk).where(Chunk.id.in_(chunk_ids))).scalars().all()
    else:
        chunks = (
            db.execute(
                select(Chunk)
                .where(Chunk.document_id == quiz.document_id)
                .order_by(Chunk.chunk_index)
            )
            .scalars()
            .all()
        )
    chunk_map = {c.id: c.content for c in chunks}

    user_prompt = _build_prompt(quiz.questions, chunk_map)

    client = get_client()
    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=DEFAULT_MAX_TOKENS,
        system=SYSTEM_PROMPT,
        tools=[VALIDATION_TOOL],
        tool_choice={"type": "tool", "name": "submit_validation"},
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_results = _extract_results(response)
    by_id: dict[uuid.UUID, dict] = {}
    for r in raw_results:
        try:
            qid = uuid.UUID(str(r.get("question_id", "")))
        except (ValueError, TypeError):
            continue
        by_id[qid] = r

    for q in quiz.questions:
        r = by_id.get(q.id)
        if r is None:
            print(f"[validator] no result for question {q.id}")
            q.validation_score = 0.0
            continue
        try:
            score = _clamp(float(r.get("overall", 0.0)))
        except (ValueError, TypeError):
            score = 0.0
        q.validation_score = score
        verdict = "PASS" if score >= threshold else "FAIL"
        comment = str(r.get("comment", "")).replace("\n", " ")[:200]
        print(f"[validator] {verdict} {q.id} ({score:.2f}) — {comment}")

    quiz.status = "validated"
    db.commit()
    db.refresh(quiz)
    return quiz
