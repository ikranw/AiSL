# AiSL

AiSL is an educational ASL translation and visualization project that explores how English text can be transformed into a more ASL-like gloss sequence and then played back through a 3D signing avatar. The repository combines a React frontend, a Flask backend, and a Unity scene exported to WebGL.

The goal is not to claim perfect ASL translation. The goal is to build a transparent learning and research prototype that helps people study how English differs from ASL word order, grammar, and signing structure while also experimenting with avatar-based playback.

## What This Project Is About

AiSL sits at the intersection of accessibility, language learning, and human-computer interaction.

In this repo:

- the frontend accepts English input and displays the translation workflow
- the backend retrieves ASL-oriented grammar examples and prompts an LLM to produce structured gloss output
- the Unity layer plays the resulting sign sequence on a 3D avatar through a WebGL bridge

This makes the project useful both as:

- a learning tool for understanding ASL-oriented sentence structure
- a research prototype for studying English-to-ASL generation constraints
- a technical experiment in connecting LLM output to embodied signing playback

## Purpose

The project was built to explore a practical question:

How can we move from spoken/written English input toward something closer to ASL structure, while staying honest about the linguistic and technical limits of that process?

More specifically, the project aims to:

- help learners see that ASL is a language with its own grammar, not English on the hands
- create a structured pipeline from text input to sign playback
- test retrieval-plus-generation methods for constrained ASL gloss output
- connect language generation with avatar animation in a way that is inspectable and extensible

## Why ASL Is Hard

ASL is not a word-for-word encoding of English. A useful educational system has to account for the fact that:

- ASL often uses topic-comment structure rather than standard English word order
- time markers are commonly introduced early in the sentence
- questions are expressed not only through tokens, but also through non-manual signals like facial expression and head movement
- spatial reference and classifier use can carry meaning that plain text gloss does not fully capture
- articles, auxiliary verbs, and other English function words may be dropped, restructured, or expressed differently

Because of that, a naive English-to-sign-token substitution system will often be misleading.

## Educational Notes on ASL Grammar

This project includes grammar-aware retrieval and prompting so the system can lean on a small set of recurring ASL patterns instead of treating translation as unrestricted text generation.

Important ideas for learners:

- `Topic-comment`: introduce the topic first, then say something about it
- `Time-first structure`: establish when something happens before the rest of the sentence
- `Question marking`: wh-questions and yes/no questions are not handled the same way
- `Negation`: negative meaning is often made explicit and positioned differently than in English
- `Non-manual signals`: brows, head position, mouth shapes, and body posture matter
- `Gloss is not ASL itself`: gloss is a textual teaching aid, not a complete representation of live signing

That last point matters most. Even a clean gloss output can still miss important information carried by timing, expression, directionality, or space.

## Research Challenges

This project exists partly because ASL generation has real research constraints.

### Linguistic challenges

- gloss is an approximation, not a full language representation
- many meanings depend on non-manual markers that are hard to encode in a simple token sequence
- the same English sentence can map to multiple valid ASL renderings depending on context
- spatial grammar and classifier constructions are difficult to model with text-only pipelines

### Data challenges

- aligned English-ASL datasets are limited and uneven in quality
- gloss conventions vary across datasets and tools
- sign inventories are incomplete relative to natural language needs
- examples can be biased toward narrow domains or simplified sentence forms

### Modeling challenges

- LLMs are good at fluent text, but that does not mean they are reliable ASL translators
- unconstrained generation can invent unsupported gloss tokens
- output must be validated and normalized before it can drive playback
- mapping a gloss token to an available animation clip is a separate problem from generating the gloss itself

### Animation challenges

- a sign clip may exist, but transitions between clips can still look unnatural
- facial expression and body posture are critical, but harder to encode than hand motion alone
- avatar rigging, retargeting, and timing can affect intelligibility
- a playback system can demonstrate sequences, but that does not guarantee linguistic completeness

## Current Project Challenges

Within this repo, the most practical challenges are:

- maintaining a usable mapping from generated gloss to available sign assets
- keeping generation constrained to the dataset and inventory the project can actually support
- improving the fidelity of non-manual information
- making transitions between isolated sign clips feel more natural
- keeping the educational framing clear so users do not confuse gloss output with authoritative ASL translation

## How The Pipeline Works

The current pipeline is:

1. A user enters English text in the React frontend.
2. The frontend sends the text to the Flask backend at `/api/translate`.
3. The backend retrieves relevant grammar rules and similar examples from local data files.
4. A prompt is built and sent to an OpenAI model to generate structured, dataset-compatible ASL gloss JSON.
5. The backend validates, normalizes, and maps the output into a sign sequence the app can use.
6. The frontend passes that sequence to the Unity WebGL build through `SendMessage`.
7. Unity receives the payload on `ASLBridge` and plays the sequence on the avatar.

At a high level:

`English input -> grammar/example retrieval -> constrained LLM output -> validation/normalization -> sign sequence -> Unity playback`

## Repository Structure

```text
app/frontend   React + Vite user interface and Unity WebGL host
app/backend    Flask API, retrieval, prompting, validation, and mapping logic
app/unity      Unity project with avatar playback and sign animation assets
```

## Running Locally

You need Node.js, Python, and an OpenAI API key.

### 1. Start the backend

```bash
cd app/backend
pip install -r requirements.txt
cp .env.example .env
# add your OPENAI_API_KEY to .env
python src/server.py
```

### 2. Start the frontend

```bash
cd app/frontend
npm install
npm run dev
```

The frontend talks to the backend at `http://localhost:8000` by default.

### 3. Unity

You do not need to open Unity to try the app locally because the frontend already includes a WebGL build.

Only open `app/unity` in Unity if you want to edit animations, scenes, or rebuild the WebGL export.

## Credits

- Studio Galt for the sign pose and sign animation source assets used throughout the project
- Microsoft Rocketbox for the avatar assets and rig foundation used for playback

These contributions are central to the prototype. The project’s signing visualization depends on both the sign asset library and the avatar pipeline.

## Important Caveat

This project should be understood as an educational and research prototype, not as a substitute for native ASL instruction, Deaf community expertise, or certified interpretation. The system is useful for learning patterns and exploring technical approaches, but ASL fluency requires far more than token generation and clip playback.
