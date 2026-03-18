"""AiSL translation service.

Converts English text to ASL gloss using OpenAI chat completions.

Mock mode
---------
If OPENAI_API_KEY is not set the service returns hardcoded demo responses so
the UI is still testable without a live API key.  This is intentional and
documented – do NOT treat mock mode as a silent failure.
"""
from __future__ import annotations

import json
import os
import re
from typing import Any

from openai import AsyncOpenAI

# ---------------------------------------------------------------------------
# Mock responses – demo / local dev only, not linguistically verified
# ---------------------------------------------------------------------------

_MOCK: dict[str, dict[str, Any]] = {
    "i am going to the store": {
        "aslGloss": ["I", "STORE", "GO"],
        "notes": ["Time/location topic moves before action.", "Mock – no API key."],
        "unknownTokens": [],
    },
    "hello how are you": {
        "aslGloss": ["HELLO", "YOU", "HOW"],
        "notes": ["Mock – no API key."],
        "unknownTokens": [],
    },
    "what is your name": {
        "aslGloss": ["YOUR", "NAME", "WHAT"],
        "notes": ["WH-question sign moves to end.", "Mock – no API key."],
        "unknownTokens": [],
    },
    "i love you": {
        "aslGloss": ["I", "LOVE", "YOU"],
        "notes": ["Mock – no API key."],
        "unknownTokens": [],
    },
    "where is the bathroom": {
        "aslGloss": ["BATHROOM", "WHERE"],
        "notes": ["WH-question at end.", "Mock – no API key."],
        "unknownTokens": [],
    },
    "i do not understand": {
        "aslGloss": ["I", "UNDERSTAND", "NOT"],
        "notes": ["Negation follows main sign.", "Mock – no API key."],
        "unknownTokens": [],
    },
    "please help me": {
        "aslGloss": ["PLEASE", "HELP", "ME"],
        "notes": ["Mock – no API key."],
        "unknownTokens": [],
    },
    "what time is it": {
        "aslGloss": ["TIME", "WHAT"],
        "notes": ["Topic-comment: time as topic.", "Mock – no API key."],
        "unknownTokens": [],
    },
    "i am happy": {
        "aslGloss": ["I", "HAPPY"],
        "notes": ["Copula dropped.", "Mock – no API key."],
        "unknownTokens": [],
    },
    "thank you": {
        "aslGloss": ["THANK-YOU"],
        "notes": ["Compound sign.", "Mock – no API key."],
        "unknownTokens": [],
    },
}

# ---------------------------------------------------------------------------
# OpenAI system prompt
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are an ASL (American Sign Language) gloss generator for an educational app \
that plays one video clip per token. Your output drives a video sequencer, so \
every token must be a single uppercase English word with NO hyphens, NO punctuation, \
and NO multi-word phrases.

━━━ ASL GRAMMAR RULES (apply all of them) ━━━

1. TOPIC-COMMENT order: put the topic (what the sentence is about) FIRST.
   English "I want to go to the store" → ASL: STORE I WANT GO
   English "I like pizza" → ASL: PIZZA I LIKE

2. TIME first: time words always open the sentence.
   English "I went to school yesterday" → ASL: YESTERDAY SCHOOL I GO

3. DROP: articles (a, an, the), copula verbs (is, are, am, was, were),
   infinitive "to", prepositions (to, ate, in, on, of) unless they carry
   meaning that cannot be shown spatially.

4. WH-questions: the WH-sign (WHO WHAT WHERE WHEN WHY HOW) moves to the END.
   English "Where is the bathroom?" → ASL: BATHROOM WHERE

5. Negation: negative signs (NOT, NEVER, NONE) follow the main verb.
   English "I don't understand" → ASL: I UNDERSTAND NOT

6. Adjectives follow nouns.
   English "big house" → ASL: HOUSE BIG

7. Keep only content words. Remove filler words that have no ASL sign.

━━━ TOKEN RULES ━━━
- Each token = ONE word, ALL CAPS, no hyphens.
  Use GO not GO-TO, use THANK not THANK-YOU.
- If a concept needs two English words (e.g. ICE CREAM), emit them as two
  separate tokens: ICE CREAM → ["ICE", "CREAM"] — unless it is a single
  well-known ASL sign like BATHROOM or GRANDMOTHER.
- If a word has no clear ASL sign, add it to unknownTokens and omit it from
  aslGloss.

Return ONLY valid JSON — no markdown, no prose:
{
  "aslGloss": ["TOKEN1", "TOKEN2"],
  "notes": ["brief grammar note explaining reordering"],
  "unknownTokens": ["words with no clear ASL sign"]
}"""


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _normalise_key(text: str) -> str:
    """Strip punctuation and lower-case for mock lookup."""
    return re.sub(r"[^a-z0-9 ]", "", text.lower()).strip()


def _mock_translate(text: str) -> dict[str, Any]:
    """Return a hardcoded demo response (OPENAI_API_KEY absent)."""
    key = _normalise_key(text)
    for phrase, data in _MOCK.items():
        if phrase in key or key in phrase:
            return {"originalText": text, **data}

    # Generic word-by-word fallback when no phrase matches
    stop = {"a", "an", "the", "is", "are", "am", "was", "were"}
    tokens = [w.upper() for w in text.split() if w.lower() not in stop]
    return {
        "originalText": text,
        "aslGloss": tokens,
        "notes": [
            "Mock fallback – no demo phrase matched.",
            "OPENAI_API_KEY is not set; running in demo mode.",
        ],
        "unknownTokens": [],
    }


def _parse_llm_response(raw: str, original_text: str) -> dict[str, Any]:
    """Parse and validate the JSON returned by the LLM."""
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"LLM returned invalid JSON: {raw!r}") from exc

    if not isinstance(parsed.get("aslGloss"), list):
        raise ValueError(f"LLM response missing aslGloss array: {parsed}")

    return {
        "originalText": original_text,
        "aslGloss": [str(t) for t in parsed.get("aslGloss", [])],
        "notes": [str(n) for n in parsed.get("notes", [])],
        "unknownTokens": [str(t) for t in parsed.get("unknownTokens", [])],
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def translate(text: str) -> dict[str, Any]:
    """Translate English text to ASL gloss.

    Returns a dict with keys: originalText, aslGloss, notes, unknownTokens.

    Uses OpenAI when OPENAI_API_KEY is present; otherwise returns a mock
    response and logs a clear warning.
    """
    text = text.strip()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        # Intentional mock mode – documented, not a silent failure.
        return _mock_translate(text)

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    client = AsyncOpenAI(api_key=api_key)

    completion = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
        response_format={"type": "json_object"},
        max_tokens=400,
        temperature=0.2,
    )

    raw = completion.choices[0].message.content or ""
    return _parse_llm_response(raw, text)
