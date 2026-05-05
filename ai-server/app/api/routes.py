from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.agents.generator import generate_quiz
from app.agents.ingestion import ingest_pdf
from app.agents.validator import validate_quiz
from app.api.schemas import DocumentOut, QuestionOut, QuizCreate, QuizOut
from app.db.models import Chunk, Document, Quiz
from app.db.session import get_db

router = APIRouter()


@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict:
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@router.post("/documents", response_model=DocumentOut, status_code=201)
async def upload_document(
    title: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> DocumentOut:
    if file.content_type not in {"application/pdf"}:
        raise HTTPException(400, "PDF 파일만 지원합니다")

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(400, "빈 파일입니다")

    effective_title = (title or file.filename or "untitled").strip()

    try:
        doc = ingest_pdf(db, title=effective_title, pdf_bytes=pdf_bytes)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e

    return DocumentOut(
        id=doc.id,
        title=doc.title,
        source_type=doc.source_type,
        chunk_count=len(doc.chunks),
    )


@router.get("/documents", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db)) -> list[DocumentOut]:
    stmt = (
        select(Document, func.count(Chunk.id).label("chunk_count"))
        .outerjoin(Chunk, Chunk.document_id == Document.id)
        .group_by(Document.id)
        .order_by(Document.uploaded_at.desc())
    )
    rows = db.execute(stmt).all()
    return [
        DocumentOut(
            id=doc.id,
            title=doc.title,
            source_type=doc.source_type,
            chunk_count=int(chunk_count),
        )
        for doc, chunk_count in rows
    ]


def _quiz_to_out(quiz: Quiz, threshold: float | None = None) -> QuizOut:
    questions = quiz.questions
    if threshold is not None:
        questions = [q for q in questions if (q.validation_score or 0.0) >= threshold]
    return QuizOut(
        id=quiz.id,
        document_id=quiz.document_id,
        status=quiz.status,
        questions=[
            QuestionOut(
                id=q.id,
                question_text=q.question_text,
                choices=q.choices,
                answer_index=q.answer_index,
                explanation=q.explanation,
                source_chunk_ids=q.source_chunk_ids,
                validation_score=q.validation_score,
            )
            for q in questions
        ],
    )


@router.post("/quizzes", response_model=QuizOut, status_code=201)
def create_quiz(payload: QuizCreate, db: Session = Depends(get_db)) -> QuizOut:
    try:
        quiz = generate_quiz(
            db,
            document_id=payload.document_id,
            count=payload.count,
            difficulty=payload.difficulty,
        )
        quiz = validate_quiz(db, quiz, threshold=payload.threshold)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except RuntimeError as e:
        raise HTTPException(502, f"문제 생성/검증 실패: {e}") from e
    return _quiz_to_out(quiz, threshold=payload.threshold)


@router.get("/quizzes/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: UUID, db: Session = Depends(get_db)) -> QuizOut:
    quiz = db.get(Quiz, quiz_id)
    if quiz is None:
        raise HTTPException(404, "quiz를 찾을 수 없습니다")
    return _quiz_to_out(quiz)
