"""
OpenRouter LLM Interface
Manages interactions with OpenRouter API (OpenAI GPT-4o and Free models),
real-time SSE streaming, and grounded fallback synthesis.
"""

import asyncio
import json
import logging
import os
from typing import AsyncGenerator, Dict, Any, List, Optional
import httpx

from backend.rag.grounding import SYSTEM_PROMPT, build_grounded_prompt, generate_extractive_fallback

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Models catalog: Flagship GPT-4o and verified active options
SUPPORTED_FREE_MODELS = [
    {
        "id": "openai/gpt-4o",
        "name": "OpenAI GPT-4o (Flagship)",
        "description": "High intelligence, precise instruction following, excellent grounding.",
        "recommended": True
    },
    {
        "id": "google/gemini-2.5-flash",
        "name": "Gemini 2.5 Flash",
        "description": "High-speed conversational reasoning and grounding.",
        "recommended": False
    },
    {
        "id": "meta-llama/llama-3.3-70b-instruct",
        "name": "Llama 3.3 70B",
        "description": "Deep instruction following and open weights.",
        "recommended": False
    }
]

# Legacy / discontinued model slug fallback mapping
MODEL_ALIASES = {
    "google/gemini-2.0-flash-exp:free": "google/gemini-2.5-flash",
    "google/gemini-2.0-flash-exp": "google/gemini-2.5-flash",
    "google/gemini-2.0-flash": "google/gemini-2.5-flash",
    "google/gemini-flash": "google/gemini-2.5-flash",
    "meta-llama/llama-3.3-70b-instruct:free": "meta-llama/llama-3.3-70b-instruct",
    "meta-llama/llama-3-70b": "meta-llama/llama-3.3-70b-instruct"
}

DEFAULT_MODEL = "openai/gpt-4o"


def load_env_file():
    """Load variables from .env file if present."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(base_dir, ".env")
    if not os.path.exists(env_path):
        env_path = os.path.join(os.getcwd(), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    if k.strip() not in os.environ:
                        os.environ[k.strip()] = v.strip()


load_env_file()


def get_api_key(custom_key: Optional[str] = None) -> Optional[str]:
    """Retrieve API key from request header or environment variable."""
    if custom_key and custom_key.strip():
        return custom_key.strip()
    return os.environ.get("OPENROUTER_API_KEY", "").strip() or None


async def call_openrouter_streaming(
    messages: List[Dict[str, str]],
    model: str,
    api_key: str
) -> AsyncGenerator[str, None]:
    """Stream response tokens from OpenRouter API."""
    resolved_model = MODEL_ALIASES.get(model, model)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-chatbot.local",
        "X-Title": "DarGlobal-Wasalt-RealEstate-Chatbot"
    }
    payload = {
        "model": resolved_model,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 800,
        "stream": True
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        async with client.stream("POST", OPENROUTER_API_URL, headers=headers, json=payload) as response:
            if response.status_code != 200:
                error_body = await response.aread()
                logger.error(f"OpenRouter error ({response.status_code}): {error_body.decode('utf-8', errors='ignore')}")
                raise RuntimeError(f"OpenRouter API returned {response.status_code}")

            async for line in response.aiter_lines():
                if not line:
                    continue
                if line.startswith("data: "):
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content")
                        if content:
                            yield content
                    except Exception:
                        continue


async def stream_rag_response(
    query: str,
    retrieved_docs: List[Dict[str, Any]],
    model: str = DEFAULT_MODEL,
    custom_api_key: Optional[str] = None
) -> AsyncGenerator[str, None]:
    """
    Orchestrates grounded RAG streaming with graceful fallback.
    """
    api_key = get_api_key(custom_api_key)
    user_prompt = build_grounded_prompt(query, retrieved_docs)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt}
    ]

    if api_key:
        models_to_try = [model]
        if model != DEFAULT_MODEL:
            models_to_try.append(DEFAULT_MODEL)

        for try_model in models_to_try:
            tokens_yielded = 0
            try:
                logger.info(f"Dispatching query to OpenRouter using model: {try_model}")
                async for token in call_openrouter_streaming(messages, try_model, api_key):
                    tokens_yielded += 1
                    yield token
                return
            except Exception as e:
                logger.warning(f"OpenRouter streaming with {try_model} failed ({e}).")
                if tokens_yielded > 0:
                    # Partial tokens were already sent to client; finish gracefully
                    return

    # Fallback to local deterministic grounded synthesis
    logger.info("Engaging local deterministic grounded synthesis fallback.")
    fallback_text = generate_extractive_fallback(query, retrieved_docs)
    words = fallback_text.split(" ")
    for i, word in enumerate(words):
        yield word + (" " if i < len(words) - 1 else "")
        await asyncio.sleep(0.02)


async def generate_rag_response_sync(
    query: str,
    retrieved_docs: List[Dict[str, Any]],
    model: str = DEFAULT_MODEL,
    custom_api_key: Optional[str] = None
) -> str:
    """Non-streaming version for standard REST calls."""
    chunks = []
    async for chunk in stream_rag_response(query, retrieved_docs, model, custom_api_key):
        chunks.append(chunk)
    return "".join(chunks)
