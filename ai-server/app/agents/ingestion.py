from io import BytesIO

from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.db.models import Chunk, Document
from app.llm.voyage import embed_documents
from app.services.chunking import chunk_text


def extract_pdf_text(pdf_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(pdf_bytes))
    pages: list[str] = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    return "\n\n".join(pages)


def ingest_pdf(db: Session, *, title: str, pdf_bytes: bytes) -> Document:
    raw_text = extract_pdf_text(pdf_bytes)
    if not raw_text.strip():
        raise ValueError("PDF에서 텍스트를 추출하지 못했습니다 (스캔 이미지일 수 있음)")

    chunks = chunk_text(raw_text)
    if not chunks:
        raise ValueError("청킹 결과가 비어있습니다")

    embeddings = embed_documents(chunks)
    if len(embeddings) != len(chunks):
        raise RuntimeError("임베딩 개수와 청크 개수가 일치하지 않습니다")

    doc = Document(title=title, source_type="pdf")
    db.add(doc)
    db.flush()

    for idx, (content, vec) in enumerate(zip(chunks, embeddings, strict=True)):
        db.add(
            Chunk(
                document_id=doc.id,
                chunk_index=idx,
                content=content,
                embedding=vec,
            )
        )
    db.commit()
    db.refresh(doc)
    return doc
