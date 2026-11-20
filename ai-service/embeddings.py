from typing import List, Optional, Any
from config import get_settings

EMBEDDING_DIMENSIONS: int = 1024
_model: Optional[Any] = None

def get_embedding_model() -> Any:
    """Lazy load SentenceTransformer embedding model on first call only."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        settings = get_settings()
        _model = SentenceTransformer(settings.embedding_model)
    return _model

def embed_texts(texts: List[str]) -> List[List[float]]:
    """Tạo vector embeddings cho danh sách văn bản và kiểm tra kích thước 1024 chiều."""
    model = get_embedding_model()
    embeddings = model.encode(texts, convert_to_numpy=True)
    results: List[List[float]] = [vector.tolist() for vector in embeddings]

    for vec in results:
        assert len(vec) == EMBEDDING_DIMENSIONS, (
            f"Embedding dimension mismatch: expected {EMBEDDING_DIMENSIONS}, got {len(vec)}"
        )
    return results
