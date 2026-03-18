# AiSL – Setup & Run Guide

## Architecture

```
Browser (React + Vite)
  └─ POST /api/translate ──proxy──► FastAPI server (Python)
                                        └─► OpenAI gpt-4o-mini
                                              └─► ASL gloss JSON
```

The React app collects English input, sends it to the FastAPI backend, receives
structured ASL gloss tokens, displays them as chips, and plays the corresponding
sign video clips one at a time in the avatar panel.

---

## 1. Backend

### Requirements
- Python 3.10+

### Install
```bash
cd app/backend
pip install -r requirements.txt
```

### Configure API key
```bash
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...
```

**If you skip this step** the server starts in **mock/demo mode**: it returns
hardcoded ASL gloss for ~10 demo phrases and a word-by-word fallback for
everything else. A warning is printed on startup.

### Run
```bash
cd app/backend
uvicorn server:app --reload --port 8000
```

The API is now available at `http://localhost:8000`.

- `POST /api/translate` – translate English → ASL gloss
- `GET  /health`        – health check (reports mock_mode)

### Run tests
```bash
cd app/backend
pytest tests/
```

Tests run in mock mode (no API key required).

---

## 2. Frontend

### Requirements
- Node 18+

### Install
```bash
cd app/frontend
npm install
```

### Run (dev)
```bash
cd app/frontend
npm run dev
```

Vite starts on `http://localhost:5173`. All `/api/*` requests are proxied to
the FastAPI backend at `http://localhost:8000`.

**Both the backend and frontend must be running** for end-to-end translation.
If only the frontend is running you will get the frontend's built-in fallback
response (a hardcoded demo sentence).

### Build (production)
```bash
npm run build
```

For production configure your web server (nginx, etc.) to proxy `/api/*` to
the FastAPI backend rather than relying on the Vite dev proxy.

---

## 3. Translation flow

```
1. User types English text in TranslatorCard
2. React calls translateEnglishToASL(text) → POST /api/translate
3. FastAPI validates the request body (pydantic)
4. translate_service.translate(text) is called:
   a. If OPENAI_API_KEY present → calls OpenAI gpt-4o-mini with a structured
      JSON system prompt requesting ASL gloss tokens
   b. If no key → returns a mock response from the hardcoded demo table
5. Backend returns:
   {
     "originalText": "I am going to the store",
     "aslGloss": ["I", "STORE", "GO"],
     "notes": ["..."],
     "unknownTokens": []
   }
6. Frontend displays aslGloss as chips, notes as bullet list
7. AvatarCard plays each sign's .mp4 video clip in sequence
```

---

## 4. Environment variables

| Variable         | Required | Default       | Description                        |
|------------------|----------|---------------|------------------------------------|
| `OPENAI_API_KEY` | No*      | –             | OpenAI secret key. Absent = mock.  |
| `OPENAI_MODEL`   | No       | `gpt-4o-mini` | OpenAI model ID for translations.  |

*Required for real LLM translations. Without it the app still runs in demo mode.
