import { useRef, useState } from "react";
import { useGenerate } from "./hooks/useGenerate";
import PromptInput from "./components/PromptInput";
import LoadingState from "./components/LoadingState";
import ErrorState from "./components/ErrorState";
import Flashcards from "./components/Flashcards";
import Quiz from "./components/Quiz";
import { loadSession } from "./lib/storage";

export default function App() {
  const { status, cards, error, dropped, resultId, generate } = useGenerate();
  const [mode, setMode] = useState("flashcards");
  const [sim, setSim] = useState("");
  const [restoredInput] = useState(() => loadSession()?.input ?? "");
  const lastInput = useRef(restoredInput);

  const run = (text) => {
    lastInput.current = text;
    generate(text, sim || undefined);
  };

  return (
    <main className="app">
      <h1>Study Assistant</h1>
            {import.meta.env.DEV && (
        <label className="muted small">
          Simulate:{" "}
          <select value={sim} onChange={(e) => setSim(e.target.value)}>
            <option value="">none (real model)</option>
            <option value="empty">empty reply</option>
            <option value="malformed">malformed JSON</option>
            <option value="shape">wrong shape</option>
            <option value="repair-demo">bad first reply, repair works</option>
            <option value="slow">slow (6s)</option>
            <option value="fail">API failure</option>
            <option value="timeout">timeout</option>
          </select>
        </label>
      )}
      <PromptInput onSubmit={run} disabled={status === "loading"} initialValue={restoredInput} />

      {status === "idle" && (
        <div className="panel center muted">Paste some notes above to get flashcards and a quiz.</div>
      )}
      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState message={error} onRetry={() => run(lastInput.current)} />}
      {status === "success" && (
        <>
          {dropped > 0 && <p className="muted center">{dropped} unusable card(s) were skipped.</p>}
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={mode === "flashcards"} className={mode === "flashcards" ? "active" : ""} onClick={() => setMode("flashcards")}>Flashcards</button>
            <button role="tab" aria-selected={mode === "quiz"} className={mode === "quiz" ? "active" : ""} onClick={() => setMode("quiz")}>Quiz</button>
          </div>
          {/* key resets child state whenever a new result arrives */}
          {mode === "flashcards"
            ? <Flashcards key={resultId} cards={cards} />
            : <Quiz key={resultId} cards={cards} />}
        </>
      )}
    </main>
  );
}
