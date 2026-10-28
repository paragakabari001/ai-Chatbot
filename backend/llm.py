"""
OpenRouter LLM Interface
Manages interactions with OpenRouter's free tier models,
streaming token generation, and graceful fallback synthesis.
"""

import json
import logging
import os
from typing import AsyncGenerator, Dict, Any, List, Optional
import httpx

from backend.rag.grounding import SYSTEM_PROMPT, build_grounded_prompt, generate_extractive_fallback

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Curated list of verified free models on OpenRouter
SUPPORTED_FREE_MODELS = [
    {
        "id": "google/gemini-2.0-flash-exp:free",
        "name": "Gemini 2.0 Flash (Free)",
        "description": "High speed, large context window, excellent reasoning.",
        "recommended": True
    },
    {
        "id": "meta-llama/llama-3.3-70b-instruct:free",
        "name": "Llama 3.3 70B Instruct (Free)",
        "description": "State-of-the-art open source reasoning and detail.",
        "recommended": False
    },
    {
        "id": "qwen/qwen-2.5-coder-32b-instruct:free",
        "name": "Qwen 2.5 Coder 32B (Free)",
        "description": "High precision instruction-following.",
        "recommended": False
    },
    {
        "id": "mistralai/mistral-7b-instruct:free",
        "name": "Mistral 7B Instruct (Free)",
        "description": "Fast and lightweight generation.",
        "recommended": False
    },
    {
        "id": "deepseek/deepseek-r1:free",
        "name": "DeepSeek R1 (Free)",
        "description": "Deep reasoning model with step-by-step logic.",
        "recommended": False
    }
]

DEFAULT_MODEL = "google/gemini-2.0-flash-exp:free"


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
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-chatbot.local",
        "X-Title": "DarGlobal-Wasalt-RealEstate-Chatbot"
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 1500,
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
        try:
            logger.info(f"Dispatching query to OpenRouter using model: {model}")
            async for token in call_openrouter_streaming(messages, model, api_key):
                yield token
            return
        except Exception as e:
            logger.warning(f"OpenRouter streaming failed ({e}). Falling back to local grounded synthesis.")

    # Fallback to local deterministic grounded synthesis
    fallback_text = generate_extractive_fallback(query, retrieved_docs)
    # Stream in word chunks for consistent UX
    words = fallback_text.split(" ")
    for i, word in enumerate(words):
        yield word + (" " if i < len(words) - 1 else "")


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
