from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class DocumentOut(BaseModel):
    id: UUID
    title: str
    source_type: str
    chunk_count: int


class QuizCreate(BaseModel):
    document_id: UUID
    count: int = Field(default=5, ge=1, le=20)
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    threshold: float = Field(default=0.7, ge=0.0, le=1.0)


class QuestionOut(BaseModel):
    id: UUID
    question_text: str
    choices: list[str]
    answer_index: int
    explanation: str | None
    source_chunk_ids: list[UUID]
    validation_score: float | None = None


class QuizOut(BaseModel):
    id: UUID
    document_id: UUID
    status: str
    questions: list[QuestionOut]
