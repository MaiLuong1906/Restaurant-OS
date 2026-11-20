import sys
import pytest
from fastapi.testclient import TestClient

from config import Settings, get_settings
from main import app

def test_default_settings():
    """Kiểm tra giá trị mặc định của Settings."""
    settings = Settings(_env_file=None)
    assert settings.llm_base_url == "https://api.groq.com/openai/v1"
    assert settings.llm_model == "openai/gpt-oss-120b"
    assert settings.llm_fallback_model == "qwen/qwen3.8-27b"
    assert settings.embedding_model == "BAAI/bge-m3"
    assert settings.llm_api_key is None
    assert settings.database_url is None

def test_require_live_config_missing(monkeypatch):
    """Kiểm tra báo lỗi khi thiếu biến bắt buộc khi chạy live."""
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    settings = Settings(_env_file=None)
    with pytest.raises(RuntimeError) as exc_info:
        settings.require_live()
    err_msg = str(exc_info.value)
    assert "Missing required environment variables for live AI chat" in err_msg
    assert "LLM_API_KEY" in err_msg
    assert "DATABASE_URL" in err_msg

def test_require_live_config_success(monkeypatch):
    """Kiểm tra thành công khi biến môi trường được cấp đủ."""
    monkeypatch.setenv("LLM_API_KEY", "gsk_test_valid_key_12345")
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost:5433/db")
    settings = Settings(_env_file=None)
    # Không ném lỗi
    settings.require_live()

def test_embeddings_laziness():
    """Kiểm tra embeddings module load lazy, không load sentence_transformers lúc import."""
    import embeddings
    # Đảm bảo model singleton ban đầu là None
    assert embeddings._model is None
    assert embeddings.EMBEDDING_DIMENSIONS == 1024

def test_llm_provider_fallback(monkeypatch):
    """Kiểm tra LLMProvider thử primary model và retry đúng 1 lần với fallback model khi gặp openai.APIError."""
    import openai
    import llm

    call_history = []

    class FakeChoice:
        def __init__(self, content):
            self.message = type("Msg", (), {"content": content})

    class FakeCompletionResponse:
        def __init__(self, content):
            self.choices = [FakeChoice(content)]

    class FakeCompletions:
        def create(self, model, messages, **kwargs):
            call_history.append(model)
            if model == "openai/gpt-oss-120b":
                # Giả lập lỗi APIError từ primary model
                request = type("Req", (), {"method": "POST", "url": "https://api.groq.com"})
                raise openai.APIError("Rate limited or primary down", request=request, body=None)
            elif model == "qwen/qwen3.8-27b":
                return FakeCompletionResponse("Fallback model response")
            return FakeCompletionResponse("Unknown model response")

    class FakeClient:
        def __init__(self):
            self.chat = type("Chat", (), {"completions": FakeCompletions()})

    settings = Settings(
        _env_file=None,
        llm_api_key="test_api_key",
        database_url="postgresql://localhost:5433/db",
    )
    provider = llm.OpenAICompatibleProvider(settings=settings)
    provider._client = FakeClient()

    result = provider.chat([{"role": "user", "content": "Xin chào"}])
    assert result == "Fallback model response"
    assert call_history == ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"]

def test_existing_endpoints_no_regression():
    """Kiểm tra /health và voice endpoint cũ không bị hồi quy."""
    client = TestClient(app)

    # 1. /health
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    data = health_resp.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ai-service"

    # 2. Kiểm tra voice route path đã đăng ký trong app
    routes = [r.path for r in app.routes]
    assert "/health" in routes
    assert "/api/v1/voice/transcribe-order" in routes
