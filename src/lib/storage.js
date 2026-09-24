import { parseResult } from "./validateResult";

const KEY = "study-assistant:last-session";

export function saveSession(input, cards) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ input, cards }));
  } catch {
    // storage can be full or blocked (private mode); the app works without it
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (typeof saved?.input !== "string") return null;
    // saved data is untrusted too: run it through the same validator
    const parsed = parseResult(JSON.stringify({ cards: saved.cards }));
    return parsed.ok ? { input: saved.input, cards: parsed.cards } : null;
  } catch {
    return null;
  }
}