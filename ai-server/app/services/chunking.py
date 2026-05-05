import re

DEFAULT_CHUNK_SIZE = 1500
DEFAULT_OVERLAP = 200


def _normalize(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_OVERLAP,
) -> list[str]:
    text = _normalize(text)
    if not text:
        return []

    raw_paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    paragraphs: list[str] = []
    for p in raw_paragraphs:
        if len(p) <= chunk_size:
            paragraphs.append(p)
            continue
        step = max(chunk_size - overlap, 1)
        for i in range(0, len(p), step):
            piece = p[i : i + chunk_size].strip()
            if piece:
                paragraphs.append(piece)

    chunks: list[str] = []
    current = ""
    for para in paragraphs:
        if not current:
            current = para
        elif len(current) + len(para) + 2 <= chunk_size:
            current = f"{current}\n\n{para}"
        else:
            chunks.append(current)
            tail = current[-overlap:] if overlap > 0 else ""
            current = f"{tail}\n\n{para}" if tail else para
    if current:
        chunks.append(current)

    final: list[str] = []
    for c in chunks:
        if len(c) <= int(chunk_size * 1.5):
            final.append(c)
            continue
        step = max(chunk_size - overlap, 1)
        for i in range(0, len(c), step):
            piece = c[i : i + chunk_size].strip()
            if piece:
                final.append(piece)
    return final
