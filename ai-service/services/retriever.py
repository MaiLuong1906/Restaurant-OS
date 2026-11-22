from typing import List, Dict, Any, Optional
import json
import psycopg
from pgvector.psycopg import register_vector
from config import get_settings
from embeddings import embed_texts

class KnowledgeRetriever:
    def __init__(self, database_url: Optional[str] = None):
        settings = get_settings()
        self.database_url = database_url or settings.database_url or "postgresql://postgres:postgres@localhost:5434/restaurant_os"

    def retrieve(self, query: str, top_k: int = 5, threshold: float = 0.5) -> List[Dict[str, Any]]:
        query_vector = embed_texts([query])[0]
        try:
            with psycopg.connect(self.database_url) as conn:
                register_vector(conn)
                with conn.cursor() as cur:
                    # Cosine distance: 1 - cosine_similarity. Similarity >= threshold <=> distance <= (1 - threshold)
                    max_distance = 1.0 - threshold
                    sql = """
                    SELECT c.chunk_text, c.metadata, (1 - (c.embedding <=> %s::vector)) AS similarity
                    FROM ai_chunks c
                    WHERE (1 - (c.embedding <=> %s::vector)) >= %s
                    ORDER BY c.embedding <=> %s::vector ASC
                    LIMIT %s;
                    """
                    cur.execute(sql, (query_vector, query_vector, threshold, query_vector, top_k))
                    rows = cur.fetchall()
                    results = []
                    for row in rows:
                        results.append({
                            "chunk_text": row[0],
                            "metadata": row[1] if isinstance(row[1], dict) else json.loads(row[1] or "{}"),
                            "similarity": float(row[2])
                        })
                    return results
        except Exception as e:
            # Fallback if DB not reachable
            return []
