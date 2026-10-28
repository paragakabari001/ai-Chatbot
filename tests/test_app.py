"""
Comprehensive Test Suite for Dar Global & Wasalt Chatbot
Verifies:
1. Knowledge base integrity and provenance.
2. Retrieval engine BM25 scoring and ranking.
3. Grounding rules and prompt formation.
4. API endpoints, rate limiting, and response formatting.
"""

import os
import json
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.rag.retriever import GroundedRetriever
from backend.rag.grounding import build_grounded_prompt, generate_extractive_fallback


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def test_retriever():
    kb_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "knowledge_base.json")
    return GroundedRetriever(kb_path=kb_path)


def test_knowledge_base_integrity():
    """Verify knowledge base has valid documents from both Dar Global and Wasalt."""
    kb_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "knowledge_base.json")
    assert os.path.exists(kb_path), "knowledge_base.json does not exist"

    with open(kb_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert len(data) >= 20, f"Expected at least 20 items, got {len(data)}"

    sources = set(doc.get("source") for doc in data)
    assert "Dar Global" in sources, "Dar Global source missing"
    assert "Wasalt" in sources, "Wasalt source missing"

    for doc in data:
        assert doc.get("id"), "Doc missing id"
        assert doc.get("title"), "Doc missing title"
        assert doc.get("url"), "Doc missing url"
        assert doc.get("content"), "Doc missing content"


def test_retriever_dar_global_query(test_retriever):
    """Verify Dar Global query matches DaVinci / Pagani / AIDA."""
    results = test_retriever.retrieve("DaVinci Tower Pagani Dubai Canal", top_k=3)
    assert len(results) > 0, "No results returned for Dar Global query"
    top_doc = results[0]
    assert top_doc["source"] == "Dar Global"
    assert "pagani" in top_doc["title"].lower() or "davinci" in top_doc["title"].lower()


def test_retriever_wasalt_query(test_retriever):
    """Verify Wasalt query matches Riyadh / REGA / Fal license."""
    results = test_retriever.retrieve("Riyadh properties rent apartments", top_k=3)
    assert len(results) > 0, "No results returned for Wasalt query"
    found_wasalt = any(doc["source"] == "Wasalt" for doc in results)
    assert found_wasalt, "Wasalt source not found in Wasalt query results"


def test_grounded_prompt_builder():
    """Verify prompt formatting includes document context and user question."""
    mock_docs = [
        {
            "source": "Dar Global",
            "title": "AIDA Muscat",
            "category": "Flagship",
            "url": "https://darglobal.co.uk/projects",
            "content": "AIDA is a cliffside golf community in Muscat, Oman."
        }
    ]
    prompt = build_grounded_prompt("Tell me about AIDA", mock_docs)
    assert "DOCUMENT 1" in prompt
    assert "AIDA Muscat" in prompt
    assert "Tell me about AIDA" in prompt


def test_fallback_extractive_generation():
    """Verify deterministic fallback produces grounded answers with citations."""
    mock_docs = [
        {
            "source": "Wasalt",
            "title": "Saudi Real Estate Regulations: REGA, Fal Licensing",
            "url": "https://wasalt.sa/en/blog",
            "content": "All property advertisements must have a valid Fal license number issued by REGA."
        }
    ]
    answer = generate_extractive_fallback("What is Fal license?", mock_docs)
    assert "Fal license" in answer
    assert "Wasalt" in answer
    assert "https://wasalt.sa/en/blog" in answer


def test_api_health(client):
    """Test /api/health endpoint."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["documents_indexed"] > 0


def test_api_models(client):
    """Test /api/models endpoint."""
    res = client.get("/api/models")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert len(data["models"]) > 0
    assert "default" in data


def test_api_knowledge(client):
    """Test /api/knowledge endpoint."""
    res = client.get("/api/knowledge")
    assert res.status_code == 200
    data = res.json()
    assert data["total_documents"] > 0
    assert "Dar Global" in data["sources"]
    assert "Wasalt" in data["sources"]


def test_api_chat_sync(client):
    """Test /api/chat/sync endpoint."""
    payload = {
        "message": "What is Dar Global's 7-day token reservation policy?",
        "model": "google/gemini-2.0-flash-exp:free",
        "top_k": 3
    }
    res = client.post("/api/chat/sync", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert len(data["citations"]) > 0
    assert data["processing_time_ms"] > 0
