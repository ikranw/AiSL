"""AiSL backend API server.

Start the server:
    cd app/backend
    uvicorn server:app --reload --port 8000

Environment variables:
    OPENAI_API_KEY  – Required for live translations. If absent, the server
                      runs in mock/demo mode and returns hardcoded responses.
    OPENAI_MODEL    – Optional. Defaults to gpt-4o-mini.
"""
from __future__ import annotations

import os
import sys

# Load .env from the backend directory before anything else reads env vars.
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Allow imports from src/ without installing the package.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

from translate_service import translate


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.getenv("OPENAI_API_KEY"):
        print(
            "\n[AiSL] WARNING: OPENAI_API_KEY is not set.\n"
            "         The server is running in MOCK / DEMO mode.\n"
            "         Responses are hardcoded – not real LLM translations.\n"
            "         Set OPENAI_API_KEY in app/backend/.env to enable live mode.\n",
            flush=True,
        )
    yield


app = FastAPI(title="AiSL Translation API", version="0.1.0", lifespan=lifespan)

# Allow the Vite dev server (port 5173) and the Vite preview server (port 4173)
# to call this API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
    ],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class TranslateRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def text_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text must not be empty or whitespace")
        if len(v) > 1000:
            raise ValueError("text must be 1000 characters or fewer")
        return v.strip()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.post("/api/translate")
async def translate_endpoint(body: TranslateRequest):
    """Convert an English sentence to ASL gloss tokens.

    Returns:
        {
          "originalText": str,
          "aslGloss": list[str],
          "notes": list[str],
          "unknownTokens": list[str]
        }
    """
    try:
        result = await translate(body.text)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail="Translation service encountered an error."
        ) from exc


@app.get("/health")
async def health():
    return {"status": "ok", "mock_mode": not bool(os.getenv("OPENAI_API_KEY"))}
