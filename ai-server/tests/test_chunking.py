import pytest
from app.services.chunking import chunk_text


def test_chunk_non_empty():
    chunks = chunk_text("Hello world. " * 50)
    assert len(chunks) > 0


def test_chunk_short_text_single_chunk():
    text = "Short text."
    chunks = chunk_text(text)
    assert len(chunks) == 1
    assert chunks[0] == text


def test_chunk_content_preserved():
    text = "First sentence. " * 100
    chunks = chunk_text(text)
    joined = " ".join(chunks)
    # all original words should appear somewhere in chunks
    assert "First" in joined
    assert "sentence" in joined


def test_chunk_no_empty_chunks():
    chunks = chunk_text("Some text here. " * 200)
    for chunk in chunks:
        assert chunk.strip() != ""


def test_chunk_empty_string():
    chunks = chunk_text("")
    assert chunks == [] or all(c.strip() == "" for c in chunks)
