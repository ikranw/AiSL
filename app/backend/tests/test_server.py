"""Basic tests for the AiSL translation API.

Run from app/backend/:
    pytest tests/

These tests run against mock mode (no OPENAI_API_KEY required).
"""
import os
import sys

# Allow imports from src/ and the server module.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

# Ensure mock mode for all tests (no real API calls).
os.environ.pop("OPENAI_API_KEY", None)

import pytest
from httpx import AsyncClient, ASGITransport

from server import app


@pytest.mark.asyncio
async def test_translate_happy_path():
    """POST /api/translate returns valid gloss for a known demo sentence."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/translate", json={"text": "I am going to the store"}
        )

    assert response.status_code == 200
    data = response.json()
    assert data["originalText"] == "I am going to the store"
    assert isinstance(data["aslGloss"], list)
    assert len(data["aslGloss"]) > 0
    assert all(isinstance(t, str) for t in data["aslGloss"])
    assert isinstance(data["notes"], list)
    assert isinstance(data["unknownTokens"], list)


@pytest.mark.asyncio
async def test_translate_empty_text_returns_422():
    """POST /api/translate with blank text returns 422 Unprocessable Entity."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/translate", json={"text": "   "})

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_translate_missing_field_returns_422():
    """POST /api/translate with no body fields returns 422."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/translate", json={})

    assert response.status_code == 422
