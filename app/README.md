rough brainstorm

react UI -> backend (apis/translate/etc) -> react recieves sign sequence -> unity plays it 


## frontend (UI + orchestration):
- shows UI
- collects english input
- calls backend api to translate
- displays ASL signs
- embeds unity webgl (?) and tells it what to play
- optional: feature enhancements (playback, loop, speed up, replay, etc)

## backend (API + LLM + mapping logic):
- exposes endpoints ex: ("/api/translate")
- calls llm (openai?) to convert english -> ASL properly
- optional: history, progress, analytics

## unity (3D/animation):
- contains 3D avatar + animation clips
- exposes entry point
- builds to webgl and produces static files that the frontend serves
