# Study Assistant

**Live demo:** https://flam-study-assistant-dnm9.onrender.com/
(Free hosting sleeps when idle, so the first load can take up to a minute.)

Paste notes or a topic. An LLM returns structured JSON, and the app renders it as flip-able flashcards and a quiz with a "re-test wrong answers" round. It is not a chatbot.

## Setup
```bash
npm install
cp .env.example .env      # add your free Groq key from console.groq.com
npm start                 # API on :3001, app on http://localhost:5173
npm test                  # validator unit tests
```
`.env` needs `GROQ_API_KEY` and optionally `GROQ_MODEL` (default `openai/gpt-oss-20b`). Set the model through the env var because Groq retires models.

## How it works
- `server/index.js`: Express proxy. Holds the API key (never sent to the browser), limits input size, and applies a 25s timeout to the Groq call. In production it also serves the built frontend.
- `src/lib/validateResult.js`: parses and validates model output. Handles empty replies, malformed JSON, code fences, wrong shape, and drops individual bad cards instead of failing the whole set.
- `src/hooks/useGenerate.js`: request state (idle/loading/error/success), client timeout, stale-response protection (request id + AbortController), and one automatic repair attempt.
- `src/lib/storage.js`: saves the last session to localStorage and re-validates it on load.
- `Flashcards` (flip, prev/next, arrow keys), `Quiz` (score, wrong-answer tracking, re-test wrong answers), and shared `LoadingState` / `ErrorState` with Retry.

Data shape: `{ "cards": [{ "question", "answer", "options": [..], "correctIndex" }] }`

## Failure handling
| Case | Behavior |
|---|---|
| Empty response | Error + Retry (no repair, nothing to send back) |
| Malformed JSON | One automatic repair request, then error + Retry |
| Wrong shape | One automatic repair request, then error + Retry |
| Some cards invalid | Bad ones skipped, notice shown |
| Slow | Loading state; server (25s) and client (60s) timeouts |
| Network/API failure | Error message + Retry |
| Stale response | Ignored via request id + abort |
| Corrupt saved session | Ignored, app starts empty |

In dev mode, a **Simulate** dropdown forces each failure type so every error state can be demonstrated on demand. It is hidden in production builds.

## AI usage note
I used Claude to generate the initial project scaffold (server proxy, validator, request hook, UI components) and to guide me through adding the repair retry, the failure simulator, and session saving. I then ran and tested every piece myself, using the Simulate dropdown and manual tests. Problems I hit and fixed myself: Groq had retired the model in my first version (404), a variable declared with `const` was reassigned in the repair path, and I placed the Simulate dropdown in the wrong component at first.

## Known limitations
- No streaming or refinement (follow-up prompts) yet.
- Quiz progress is not saved, only the cards.
- Card quality depends on the model; quiz distractors can be weak.
- Free-tier hosting is slow to wake and the model API is rate-limited.

## What I'd do next
Streaming output, follow-up prompts that edit the existing set, saving quiz progress, and input type checks on the server.