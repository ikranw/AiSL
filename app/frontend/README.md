# AiSL Frontend

AiSL (AI-Powered Sign Language Learning) is a single-page React + MUI experience that
translates English text into ASL gloss and prepares a Unity WebGL bridge for 3D avatar
playback.

## Requirements
- Node.js 18+
- npm

## Setup
```bash
npm install
```

## Run
```bash
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Notes
- The translation service is stubbed in `src/services/llmService.ts`. It posts to
  `/api/translate` and falls back to a safe mock response if the backend is unavailable.
- The Unity bridge stub lives in `src/services/unityBridge.ts`. It uses the standard
  `SendMessage` pattern expected by Unity WebGL builds.
