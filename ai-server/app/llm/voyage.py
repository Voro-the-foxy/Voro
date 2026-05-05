import voyageai

from app.config import settings

EMBEDDING_MODEL = "voyage-3"
EMBEDDING_DIM = 1024

_client: voyageai.Client | None = None


def _client_singleton() -> voyageai.Client:
    global _client
    if _client is None:
        if not settings.voyage_api_key:
            raise RuntimeError("VOYAGE_API_KEY is not set")
        _client = voyageai.Client(api_key=settings.voyage_api_key)
    return _client


def embed_documents(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    client = _client_singleton()
    result = client.embed(texts, model=EMBEDDING_MODEL, input_type="document")
    return result.embeddings


def embed_query(text: str) -> list[float]:
    client = _client_singleton()
    result = client.embed([text], model=EMBEDDING_MODEL, input_type="query")
    return result.embeddings[0]
