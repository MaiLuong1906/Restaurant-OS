import functools
from typing import Optional, Union, Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # FastAPI / Whisper existing settings
    port: int = 8000
    host: str = "0.0.0.0"
    debug: Union[bool, str] = True
    whisper_model_size: str = "base"
    device: str = "cpu"
    internal_api_key: Optional[str] = None

    # AI Chat & RAG settings
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "openai/gpt-oss-120b"
    llm_fallback_model: str = "qwen/qwen3.8-27b"
    embedding_model: str = "BAAI/bge-m3"

    # Live secrets without default (placeholder values in .env.example are treated as unset)
    llm_api_key: Optional[str] = None
    database_url: Optional[str] = None

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug(cls, v: Any) -> Union[bool, str]:
        if isinstance(v, str):
            if v.lower() in ("true", "1", "yes"):
                return True
            if v.lower() in ("false", "0", "no"):
                return False
        return v

    def require_live(self) -> None:
        """Kiểm tra các biến môi trường bắt buộc khi chạy live mode."""
        missing = []
        placeholder_key = "your-groq-api-key-here"

        if not self.llm_api_key or self.llm_api_key.strip() == "" or self.llm_api_key.strip() == placeholder_key:
            missing.append("LLM_API_KEY")
        if not self.database_url or self.database_url.strip() == "":
            missing.append("DATABASE_URL")

        if missing:
            raise RuntimeError(
                f"Missing required environment variables for live AI chat: {', '.join(missing)}"
            )

def require_live_config(settings: Settings) -> None:
    settings.require_live()

@functools.lru_cache()
def get_settings() -> Settings:
    return Settings()
