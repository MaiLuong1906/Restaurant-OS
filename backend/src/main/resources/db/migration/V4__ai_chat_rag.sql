-- ====================================================================
-- V4__ai_chat_rag.sql: AI Chat RAG Store and Guest Chat Logs
-- Project: Restaurant OS (PostgreSQL 16+ / pgvector 0.5+ / Flyway 10+)
-- Purpose: Schema for AI chat RAG store and guest chat logs for the Phố Cổ AI assistant
-- Note: Applies after V3 (per specification requirement §8).
-- Requirement: PostgreSQL with pgvector extension available (Supabase).
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. PGVECTOR EXTENSION
-- --------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- --------------------------------------------------------------------
-- 2. KNOWLEDGE BASE TABLES (RAG STORE)
-- --------------------------------------------------------------------

-- 2.1. Bảng lưu trữ tài liệu nguồn kiến thức (ai_documents)
CREATE TABLE IF NOT EXISTS ai_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.2. Bảng lưu trữ các đoạn văn bản kèm vector embedding 1024 chiều (ai_chunks)
CREATE TABLE IF NOT EXISTS ai_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding vector(1024) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index HNSW phục vụ tìm kiếm tương đồng vector cosine
CREATE INDEX idx_ai_chunks_embedding_hnsw ON ai_chunks USING hnsw (embedding vector_cosine_ops);

-- --------------------------------------------------------------------
-- 3. GUEST CHAT LOGS & FEEDBACK
-- --------------------------------------------------------------------

-- 3.1. Bảng phiên trò chuyện của khách hàng (chat_sessions)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID UNIQUE NOT NULL,
    phone_hash VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3.2. Bảng tin nhắn trò chuyện (chat_messages)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    tool_calls JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3.3. Bảng phản hồi chất lượng câu trả lời từ khách (chat_feedback)
CREATE TABLE IF NOT EXISTS chat_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    message_id UUID,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) & POLICIES
-- --------------------------------------------------------------------

-- Bật Row Level Security cho 3 bảng chat
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_feedback ENABLE ROW LEVEL SECURITY;

-- Note on UPDATE and DELETE operations:
-- Intentionally denied for anonymous (anon) and standard authenticated roles.
-- No UPDATE or DELETE policies are defined, preventing mutation or deletion of chat history by clients.

-- 4.1. Policies cho chat_sessions
CREATE POLICY chat_sessions_anon_insert ON chat_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY chat_sessions_staff_select ON chat_sessions FOR SELECT TO authenticated USING (true);
-- Note: service_role bypasses RLS by default on Supabase; policy documents explicit read access.
CREATE POLICY chat_sessions_service_select ON chat_sessions FOR SELECT TO service_role USING (true);

-- 4.2. Policies cho chat_messages
CREATE POLICY chat_messages_anon_insert ON chat_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY chat_messages_staff_select ON chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY chat_messages_service_select ON chat_messages FOR SELECT TO service_role USING (true);

-- 4.3. Policies cho chat_feedback
CREATE POLICY chat_feedback_anon_insert ON chat_feedback FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY chat_feedback_staff_select ON chat_feedback FOR SELECT TO authenticated USING (true);
CREATE POLICY chat_feedback_service_select ON chat_feedback FOR SELECT TO service_role USING (true);
