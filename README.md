# Study Assistant (Flam Frontend Internship Assignment)

Paste notes or a topic. An LLM generates structured JSON, and the app renders it as flip-able flashcards and a quiz with a "re-test wrong answers" round. It is not a chatbot.

## Setup
```bash
npm install
cp .env.example .env      # add your free Groq key from console.groq.com
npm start                 # API on :3001, app on http://localhost:5173
npm test                  # validator unit tests
```

## How it works
- `server/index.js`: small Express proxy. Holds the API key (never sent to the browser), enforces input limits, and a 25s timeout to Groq (`llama-3.3-70b-versatile`, JSON mode).
- `src/lib/validateResult.js`: parses and validates model output. Handles empty, malformed JSON, code fences, wrong shape, and drops individual bad cards instead of failing the whole set.
- `src/hooks/useGenerate.js`: request state (idle/loading/error/success), client timeout, and stale-response protection using a request id plus AbortController, so an older slow response can never overwrite a newer one.
- `Flashcards` (flip, prev/next, arrow keys), `Quiz` (score, wrong-answer tracking, re-test wrong answers), plus shared `LoadingState` / `ErrorState` (with Retry).

Data shape: `{ "cards": [{ "question", "answer", "options": [..], "correctIndex" }] }`

## Failure handling
| Case | Behavior |
|---|---|
| Empty response | Error state + retry |
| Malformed JSON | Error state + retry |
| Wrong shape | Error state + retry |
| Some cards invalid | Bad ones skipped, notice shown |
| Slow | Loading state; server (25s) and client (30s) timeouts |
| Network/API failure | Error message + retry |
| Stale response | Ignored via request id + abort |

## AI usage note
I used Claude to help scaffold the server proxy, the validator, and the request hook, and to generate the UI components. I read through, tested, and can explain each part. <!-- EDIT: describe honestly what you wrote or changed yourself -->

## Known limitations
- No session saving, streaming, or refinement loop.
- Card quality depends on the model; the quiz distractors can be weak.
- Not deployed.

## Time spent
<!-- EDIT: put your real hours here -->

## What I'd do next
Streaming output, follow-up prompts that edit the set, saving sessions to localStorage.
