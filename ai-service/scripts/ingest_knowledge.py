import os
import sys
import json
import logging
from typing import List, Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx
import psycopg
from pgvector.psycopg import register_vector
from config import get_settings
from embeddings import embed_texts

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def chunk_markdown_by_sections(text: str) -> List[str]:
    """Tách markdown theo các tiêu đề H2 (##) để giữ trọn vẹn ngữ cảnh từng chính sách."""
    sections = text.split("\n## ")
    chunks = []
    for i, sec in enumerate(sections):
        cleaned = sec.strip()
        if not cleaned:
            continue
        if i > 0 and not cleaned.startswith("## "):
            cleaned = "## " + cleaned
        chunks.append(cleaned)
    return chunks

def fetch_menu_from_backend(backend_url: str) -> List[Dict[str, Any]]:
    """Lấy danh sách món ăn thật từ REST API Backend Spring Boot."""
    url = f"{backend_url.rstrip('/')}/dishes"
    try:
        resp = httpx.get(url, timeout=5.0)
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            logger.info(f"Đã lấy {len(data)} món ăn thật từ Backend API ({url})")
            return data
    except Exception as e:
        logger.warning(f"Không thể kết nối Backend API ({url}): {e}")
    return []

def ingest_knowledge():
    settings = get_settings()
    db_url = settings.database_url or "postgresql://postgres:postgres@localhost:5434/restaurant_os"
    backend_url = settings.backend_api_url or "http://localhost:8080/api/v1"

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    root_dir = os.path.dirname(base_dir)

    documents = []

    # 1. Chính sách nhà hàng từ policy_faq.md
    policy_paths = [
        os.path.join(base_dir, "data", "policy_faq.md"),
        os.path.join(root_dir, "doc", "design", "policy_faq.md"),
    ]
    policy_content = ""
    for p in policy_paths:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                policy_content = f.read()
                logger.info(f"Đọc tài liệu chính sách từ: {p}")
                break

    if policy_content:
        documents.append({
            "source": "doc/design/policy_faq.md",
            "title": "Chính sách nhà hàng & Giờ mở cửa & Tiện ích",
            "chunks": chunk_markdown_by_sections(policy_content),
            "metadata": {"category": "restaurant_policy"}
        })

    # 2. Thực đơn thật từ Backend Spring Boot API (hoặc Postgres dishes)
    dishes = fetch_menu_from_backend(backend_url)
    if not dishes:
        # Fallback đọc từ Postgres trực tiếp
        try:
            with psycopg.connect(db_url) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT id, name, description, price, is_available, category FROM dishes;")
                    rows = cur.fetchall()
                    for r in rows:
                        dishes.append({
                            "id": str(r[0]),
                            "name": r[1],
                            "description": r[2],
                            "price": int(r[3]),
                            "isAvailable": bool(r[4]),
                            "category": r[5] or "MAIN"
                        })
                    logger.info(f"Fallback đọc được {len(dishes)} món ăn từ database dishes")
        except Exception as e:
            logger.error(f"Lỗi truy vấn bảng dishes: {e}")

    if dishes:
        dish_chunks = []
        for d in dishes:
            name = d.get("name")
            price = int(d.get("price", 0))
            desc = d.get("description") or "Không có mô tả"
            avail = "Còn món (đang phục vụ)" if d.get("isAvailable") else "Hết món"
            cat = d.get("category") or "MAIN"
            chunk = (
                f"Món: {name}\n"
                f"Giá: {price:,} VND\n"
                f"Danh mục: {cat}\n"
                f"Mô tả nguyên liệu: {desc}\n"
                f"Tình trạng: {avail}"
            )
            dish_chunks.append(chunk)

        documents.append({
            "source": "api/v1/dishes",
            "title": "Thực đơn món ăn nhà hàng Phố Cổ (Backend)",
            "chunks": dish_chunks,
            "metadata": {"category": "menu"}
        })

    # 3. Dị ứng riêng nếu user có cung cấp data/allergy_info.md
    allergy_path = os.path.join(base_dir, "data", "allergy_info.md")
    if os.path.exists(allergy_path):
        with open(allergy_path, "r", encoding="utf-8") as f:
            allergy_content = f.read()
            documents.append({
                "source": "data/allergy_info.md",
                "title": "Thông tin dị ứng món ăn",
                "chunks": chunk_markdown_by_sections(allergy_content),
                "metadata": {"category": "allergy"}
            })
            logger.info("Đã nạp file dị ứng data/allergy_info.md")
    else:
        logger.info("Chưa có file data/allergy_info.md từ user, thông tin dị ứng dựa trên mô tả thành phần món ăn thật.")

    logger.info(f"Kết nối Postgres pgvector tại: {db_url}")
    with psycopg.connect(db_url) as conn:
        register_vector(conn)
        with conn.cursor() as cur:
            # Dọn dẹp dữ liệu cũ trong ai_chunks và ai_documents để tránh lẫn doc seed cũ
            cur.execute("DELETE FROM ai_chunks;")
            cur.execute("DELETE FROM ai_documents;")

            for doc in documents:
                cur.execute("""
                    INSERT INTO ai_documents (source, title, content, metadata, updated_at)
                    VALUES (%s, %s, %s, %s::jsonb, CURRENT_TIMESTAMP)
                    RETURNING id;
                """, (doc["source"], doc["title"], "\n\n".join(doc["chunks"]), json.dumps(doc["metadata"])))
                doc_id = cur.fetchone()[0]

                chunks = doc["chunks"]
                logger.info(f"Tài liệu '{doc['title']}': bắt đầu nhúng {len(chunks)} chunks.")
                if chunks:
                    embeddings = embed_texts(chunks)
                    for chunk_txt, emb in zip(chunks, embeddings):
                        cur.execute("""
                            INSERT INTO ai_chunks (document_id, chunk_text, embedding, metadata)
                            VALUES (%s, %s, %s, %s::jsonb);
                        """, (doc_id, chunk_txt, emb, json.dumps(doc["metadata"])))
        conn.commit()
    logger.info("Hoàn tất nạp kiến thức RAG vào pgvector!")

if __name__ == "__main__":
    ingest_knowledge()
