"""
FastAPI Full-Stack Server for Dar Global & Wasalt AI Chatbot
"""

import json
import logging
import os
import time
from typing import Optional, List
from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend.rag.retriever import retriever
from backend.llm import (
    stream_rag_response,
    generate_rag_response_sync,
    SUPPORTED_FREE_MODELS,
    DEFAULT_MODEL,
    get_api_key
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("api")

app = FastAPI(
    title="Dar Global & Wasalt AI Real Estate Chatbot",
    description="Production-grade AI Chatbot grounded in public data from Dar Global and Wasalt.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to static frontend files
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
STATIC_DIR = os.path.join(FRONTEND_DIR, "static")


# Pydantic Request Models
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User question")
    model: Optional[str] = Field(default=DEFAULT_MODEL, description="OpenRouter model ID")
    top_k: Optional[int] = Field(default=4, ge=1, le=10, description="Number of context documents")


class ChatSyncResponse(BaseModel):
    response: str
    citations: List[dict]
    model: str
    processing_time_ms: float


# Simple in-memory rate limiter per IP
RATE_LIMIT_STORE = {}
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 60


@app.middleware("http")
async def rate_limit_and_security_headers(request: Request, call_next):
    # Security Headers
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()

    # Rate limiting for API calls
    if request.url.path.startswith("/api/chat"):
        client_history = RATE_LIMIT_STORE.get(client_ip, [])
        # prune old timestamps
        client_history = [t for t in client_history if now - t < RATE_LIMIT_WINDOW]
        if len(client_history) >= RATE_LIMIT_MAX_REQUESTS:
            raise HTTPException(status_code=429, detail="Too many requests. Please wait a minute.")
        client_history.append(now)
        RATE_LIMIT_STORE[client_ip] = client_history

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


@app.get("/api/health")
async def health_check():
    """Health check endpoint for Docker and monitoring."""
    return {
        "status": "healthy",
        "documents_indexed": len(retriever.documents),
        "timestamp": time.time()
    }


@app.get("/api/models")
async def get_models(x_openrouter_key: Optional[str] = Header(None)):
    """List available free OpenRouter models and check key availability."""
    key = get_api_key(x_openrouter_key)
    return {
        "models": SUPPORTED_FREE_MODELS,
        "default": DEFAULT_MODEL,
        "has_api_key": bool(key)
    }


@app.get("/api/knowledge")
async def get_knowledge_summary():
    """Summary of ingested documents from Dar Global & Wasalt."""
    docs = retriever.documents
    sources = {}
    categories = {}
    for d in docs:
        src = d.get("source", "Unknown")
        cat = d.get("category", "General")
        sources[src] = sources.get(src, 0) + 1
        categories[cat] = categories.get(cat, 0) + 1

    return {
        "total_documents": len(docs),
        "sources": sources,
        "categories": categories
    }


@app.post("/api/chat")
async def chat_stream(
    payload: ChatRequest,
    x_openrouter_key: Optional[str] = Header(None)
):
    """
    Server-Sent Events (SSE) streaming chat endpoint.
    Emits citations first, then tokens, and finally a done event.
    """
    query = payload.message.strip()
    docs = retriever.retrieve(query, top_k=payload.top_k)

    citations = [
        {
            "id": d.get("id"),
            "source": d.get("source"),
            "title": d.get("title"),
            "url": d.get("url"),
            "category": d.get("category"),
            "relevance_score": d.get("relevance_score")
        }
        for d in docs
    ]

    async def event_generator():
        # 1. Send citations metadata
        yield f"event: citations\ndata: {json.dumps(citations)}\n\n"

        # 2. Stream answer tokens
        async for token in stream_rag_response(
            query=query,
            retrieved_docs=docs,
            model=payload.model,
            custom_api_key=x_openrouter_key
        ):
            payload_data = json.dumps({"token": token})
            yield f"event: token\ndata: payload_data\n\n".replace("payload_data", payload_data)

        # 3. Send done
        yield "event: done\ndata: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/api/chat/sync", response_model=ChatSyncResponse)
async def chat_sync(
    payload: ChatRequest,
    x_openrouter_key: Optional[str] = Header(None)
):
    """Non-streaming chat endpoint for REST clients."""
    start_t = time.time()
    query = payload.message.strip()
    docs = retriever.retrieve(query, top_k=payload.top_k)

    response_text = await generate_rag_response_sync(
        query=query,
        retrieved_docs=docs,
        model=payload.model,
        custom_api_key=x_openrouter_key
    )

    citations = [
        {
            "id": d.get("id"),
            "source": d.get("source"),
            "title": d.get("title"),
            "url": d.get("url"),
            "category": d.get("category"),
            "relevance_score": d.get("relevance_score")
        }
        for d in docs
    ]

    duration = round((time.time() - start_t) * 1000, 2)
    return ChatSyncResponse(
        response=response_text,
        citations=citations,
        model=payload.model,
        processing_time_ms=duration
    )


# Mount static assets
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
async def serve_index():
    """Serve frontend web interface."""
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Dar Global & Wasalt Chatbot API is running. Index file not found."}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
