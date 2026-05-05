import json
import uuid
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Chunk, Document, Question, Quiz
from app.llm.claude import DEFAULT_MODEL, get_client

Difficulty = Literal["easy", "medium", "hard"]

MAX_CONTEXT_CHUNKS = 30
DEFAULT_MAX_TOKENS = 4096

DIFFICULTY_GUIDE = {
    "easy": "정의, 명시된 사실 확인 위주의 단순 회상 문제",
    "medium": "개념 비교 또는 자료 내용을 적용해야 풀 수 있는 문제",
    "hard": "여러 개념을 종합하거나 추론이 필요한 문제",
}

SYSTEM_PROMPT = """당신은 강의자료 기반 학습용 객관식 문제를 만드는 출제자입니다.

규칙:
- 자료에 명시된 사실만 근거로 문제를 만드세요. 자료에 없는 외부 지식은 사용 금지.
- 각 문제는 4개의 선택지를 가지며, 정답은 정확히 1개여야 합니다.
- 오답은 자료와 명백히 모순되거나 자료에 등장하지 않는 내용이어야 하며, 정답과 비슷한 길이로 작성하세요.
- explanation에는 정답 근거를 자료의 표현으로 간결히 설명하세요.
- source_chunk_ids에는 문제 출제에 사용한 chunk_id를 모두 포함하세요(입력으로 받은 ID 외 임의 생성 금지).
- 동일하거나 거의 같은 문제를 중복 출제하지 마세요."""


SUBMIT_QUESTIONS_TOOL = {
    "name": "submit_questions",
    "description": "생성한 객관식 문제 목록을 제출합니다.",
    "input_schema": {
        "type": "object",
        "properties": {
            "questions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string", "description": "문제 본문"},
                        "choices": {
                            "type": "array",
                            "items": {"type": "string"},
                            "minItems": 4,
                            "maxItems": 4,
                            "description": "4개의 선택지",
                        },
                        "answer_index": {
                            "type": "integer",
                            "minimum": 0,
                            "maximum": 3,
                            "description": "정답인 선택지의 0-based 인덱스",
                        },
                        "explanation": {
                            "type": "string",
                            "description": "정답 근거 해설",
                        },
                        "source_chunk_ids": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "문제 출제에 사용한 입력 chunk_id 목록",
                        },
                    },
                    "required": [
                        "question",
                        "choices",
                        "answer_index",
                        "explanation",
                        "source_chunk_ids",
                    ],
                },
            }
        },
        "required": ["questions"],
    },
}


def _sample_chunks(chunks: list[Chunk], limit: int) -> list[Chunk]:
    if len(chunks) <= limit:
        return chunks
    step = len(chunks) / limit
    indices = sorted({int(i * step) for i in range(limit)})
    return [chunks[i] for i in indices][:limit]


def _build_user_prompt(chunks: list[Chunk], count: int, difficulty: Difficulty) -> str:
    guide = DIFFICULTY_GUIDE[difficulty]
    parts = [
        f"다음 강의자료에서 {difficulty} 난이도 ({guide})의 객관식 문제 {count}개를 만들어주세요.",
        "각 chunk_id는 자료의 특정 부분 식별자입니다. source_chunk_ids에 그대로 사용하세요.",
        "",
        "=== 자료 ===",
    ]
    for ch in chunks:
        parts.append(f"\n[chunk_id: {ch.id}]")
        parts.append(ch.content)
    parts.append("\n=== 끝 ===")
    parts.append(f"\n위 자료만 근거로 {count}개의 객관식 문제를 submit_questions 도구로 제출하세요.")
    return "\n".join(parts)


def _extract_tool_input(response) -> dict:
    for block in response.content:
        if getattr(block, "type", None) == "tool_use" and block.name == "submit_questions":
            return block.input
    raise RuntimeError("Claude가 submit_questions 도구를 호출하지 않았습니다")


def _validate_question(q: dict, valid_chunk_ids: set[uuid.UUID]) -> dict:
    if not isinstance(q.get("choices"), list) or len(q["choices"]) != 4:
        raise ValueError(f"선택지는 4개여야 합니다: {q!r}")
    if not 0 <= int(q["answer_index"]) <= 3:
        raise ValueError(f"answer_index가 범위를 벗어납니다: {q!r}")

    parsed_ids: list[uuid.UUID] = []
    for raw in q.get("source_chunk_ids", []):
        try:
            cid = uuid.UUID(str(raw))
        except (ValueError, TypeError):
            continue
        if cid in valid_chunk_ids:
            parsed_ids.append(cid)
    return {
        "question": str(q["question"]).strip(),
        "choices": [str(c).strip() for c in q["choices"]],
        "answer_index": int(q["answer_index"]),
        "explanation": str(q.get("explanation", "")).strip() or None,
        "source_chunk_ids": parsed_ids,
    }


def generate_quiz(
    db: Session,
    *,
    document_id: uuid.UUID,
    count: int,
    difficulty: Difficulty = "medium",
) -> Quiz:
    if not 1 <= count <= 20:
        raise ValueError("count는 1~20 사이여야 합니다")

    doc = db.get(Document, document_id)
    if doc is None:
        raise ValueError("document를 찾을 수 없습니다")

    chunks = (
        db.execute(
            select(Chunk).where(Chunk.document_id == document_id).order_by(Chunk.chunk_index)
        )
        .scalars()
        .all()
    )
    if not chunks:
        raise ValueError("청크가 없습니다 — 먼저 문서를 인제스트해야 합니다")

    sampled = _sample_chunks(list(chunks), MAX_CONTEXT_CHUNKS)
    valid_chunk_ids = {c.id for c in sampled}

    user_prompt = _build_user_prompt(sampled, count, difficulty)

    client = get_client()
    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=DEFAULT_MAX_TOKENS,
        system=SYSTEM_PROMPT,
        tools=[SUBMIT_QUESTIONS_TOOL],
        tool_choice={"type": "tool", "name": "submit_questions"},
        messages=[{"role": "user", "content": user_prompt}],
    )

    tool_input = _extract_tool_input(response)
    raw_questions = tool_input.get("questions", [])
    if not raw_questions:
        raise RuntimeError("생성된 문제가 없습니다")

    quiz = Quiz(document_id=document_id, status="generated")
    db.add(quiz)
    db.flush()

    for raw in raw_questions:
        try:
            v = _validate_question(raw, valid_chunk_ids)
        except (ValueError, KeyError, TypeError) as e:
            # skip malformed questions instead of failing the whole batch
            print(f"[generator] skipping invalid question: {e}: {json.dumps(raw, ensure_ascii=False)}")
            continue
        db.add(
            Question(
                quiz_id=quiz.id,
                question_text=v["question"],
                choices=v["choices"],
                answer_index=v["answer_index"],
                explanation=v["explanation"],
                source_chunk_ids=v["source_chunk_ids"],
            )
        )

    db.commit()
    db.refresh(quiz)
    return quiz
