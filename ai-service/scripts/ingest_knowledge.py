import os
import json
import uuid
from typing import List, Dict, Any
import psycopg
from pgvector.psycopg import register_vector
from config import get_settings
from embeddings import embed_texts

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += (chunk_size - overlap)
    return chunks

def ingest_knowledge():
    settings = get_settings()
    db_url = settings.database_url or "postgresql://postgres:postgres@localhost:5434/restaurant_os"

    # 1. Documents from design / policy markdown
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    root_dir = os.path.dirname(base_dir)
    design_dir = os.path.join(root_dir, "doc", "design")

    documents = []

    # Knowledge: Policies, Opening hours, Parking
    faq_doc = """
    # THÔNG TIN NHÀ HÀNG PHỐ CỔ
    - Địa chỉ: 12 Hàng Bè, Hoàn Kiếm, Hà Nội
    - Giờ mở cửa: 10:00 - 22:30 hàng ngày từ thứ Hai đến Chủ Nhật.
    - Chỗ để xe: Nhà hàng có bãi đỗ xe máy miễn phí ngay trước cửa và bãi gửi xe ô tô cách 50m có bảo vệ trông giữ.
    - Chính sách đặt bàn: Khách đặt bàn trước 30 phút để quán sắp xếp chu đáo nhất. Không thu phí cọc cho bàn dưới 10 người.
    - Món chay: Quán có thực đơn chay phong phú gồm Đậu phụ tẩm hành chay, Nấm kho chay, Nem chay phố cổ, canh rau củ tươi ngon mỗi ngày.
    """
    documents.append({
        "source": "doc/design/policy_faq.md",
        "title": "Chính sách nhà hàng & Giờ mở cửa & Chỗ để xe",
        "content": faq_doc.strip(),
        "metadata": {"category": "restaurant_info"}
    })

    # Read from local postgres dishes if available
    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, name, description, price, is_available FROM dishes;")
                dishes = cur.fetchall()
                dish_text = "# THỰC ĐƠN PHỐ CỔ TỪ HỆ THỐNG:\n"
                for d in dishes:
                    dish_text += f"- Món: {d[1]} | Giá: {int(d[3]):,} VND | Mô tả: {d[2]} | Tình trạng: {'Còn món' if d[4] else 'Hết món'}\n"
                documents.append({
                    "source": "database/dishes",
                    "title": "Thực đơn món ăn nhà hàng Phố Cổ",
                    "content": dish_text.strip(),
                    "metadata": {"category": "menu"}
                })
    except Exception:
        # Fallback to seed json
        seed_path = os.path.join(base_dir, "data", "dish_availability.json")
        if os.path.exists(seed_path):
            with open(seed_path, "r", encoding="utf-8") as f:
                seed_data = json.load(f)
                dish_text = "# THỰC ĐƠN PHỐ CỔ (SEED):\n"
                for s in seed_data:
                    dish_text += f"- Món: {s['name']} | Tình trạng: {'Còn món' if s['available'] else 'Hết món'}\n"
                documents.append({
                    "source": "data/dish_availability.json",
                    "title": "Thực đơn món ăn nhà hàng Phố Cổ",
                    "content": dish_text.strip(),
                    "metadata": {"category": "menu"}
                })

    print(f"Connecting to Postgres at {db_url}...")
    with psycopg.connect(db_url) as conn:
        register_vector(conn)
        with conn.cursor() as cur:
            for doc in documents:
                # Upsert ai_documents
                cur.execute("""
                    INSERT INTO ai_documents (source, title, content, metadata, updated_at)
                    VALUES (%s, %s, %s, %s::jsonb, CURRENT_TIMESTAMP)
                    RETURNING id;
                """, (doc["source"], doc["title"], doc["content"], json.dumps(doc["metadata"])))
                doc_id = cur.fetchone()[0]

                # Chunking
                chunks = chunk_text(doc["content"])
                print(f"Document '{doc['title']}': generated {len(chunks)} chunks.")
                if chunks:
                    embeddings = embed_texts(chunks)
                    for chunk_txt, emb in zip(chunks, embeddings):
                        cur.execute("""
                            INSERT INTO ai_chunks (document_id, chunk_text, embedding, metadata)
                            VALUES (%s, %s, %s, %s::jsonb);
                        """, (doc_id, chunk_txt, emb, json.dumps(doc["metadata"])))
        conn.commit()
    print("Ingestion completed successfully!")

if __name__ == "__main__":
    ingest_knowledge()
