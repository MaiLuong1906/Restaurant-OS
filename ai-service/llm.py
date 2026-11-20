import functools
from typing import Iterator, List, Dict, Any, Optional, Protocol
import openai
from config import get_settings, Settings

class LLMProvider(Protocol):
    def chat(self, messages: List[Dict[str, Any]], model: Optional[str] = None) -> str:
        ...

    def stream_chat(self, messages: List[Dict[str, Any]], model: Optional[str] = None) -> Iterator[str]:
        ...

class OpenAICompatibleProvider:
    def __init__(self, settings: Optional[Settings] = None):
        self._settings = settings or get_settings()
        self._client: Optional[openai.OpenAI] = None

    def _get_client(self) -> openai.OpenAI:
        self._settings.require_live()
        if self._client is None:
            self._client = openai.OpenAI(
                base_url=self._settings.llm_base_url,
                api_key=self._settings.llm_api_key,
            )
        return self._client

    def chat(self, messages: List[Dict[str, Any]], model: Optional[str] = None) -> str:
        client = self._get_client()
        primary_model = model or self._settings.llm_model
        fallback_model = self._settings.llm_fallback_model

        try:
            response = client.chat.completions.create(
                model=primary_model,
                messages=messages,
            )
            return response.choices[0].message.content or ""
        except openai.APIError:
            # Retry exactly once with fallback model
            response = client.chat.completions.create(
                model=fallback_model,
                messages=messages,
            )
            return response.choices[0].message.content or ""

    def stream_chat(self, messages: List[Dict[str, Any]], model: Optional[str] = None) -> Iterator[str]:
        client = self._get_client()
        primary_model = model or self._settings.llm_model
        fallback_model = self._settings.llm_fallback_model

        try:
            response = client.chat.completions.create(
                model=primary_model,
                messages=messages,
                stream=True,
            )
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except openai.APIError:
            # Retry exactly once with fallback model
            response = client.chat.completions.create(
                model=fallback_model,
                messages=messages,
                stream=True,
            )
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

@functools.lru_cache()
def get_llm_provider() -> OpenAICompatibleProvider:
    return OpenAICompatibleProvider()
