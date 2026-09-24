import { useEffect, useState } from "react";

export default function Flashcards({ cards }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[i];

  const go = (d) => {
    setFlipped(false);
    setI((n) => Math.min(cards.length - 1, Math.max(0, n + d)));
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards.length]);

  return (
    <div className="panel">
      <p className="muted">Card {i + 1} of {cards.length}</p>
      <button className="card" onClick={() => setFlipped((f) => !f)} aria-label="Flip card">
        <span className="muted small">{flipped ? "Answer" : "Question"}</span>
        <span className="card-text">{flipped ? card.answer : card.question}</span>
        <span className="muted small">Tap to flip</span>
      </button>
      <div className="row">
        <button className="secondary" onClick={() => go(-1)} disabled={i === 0}>Previous</button>
        <button className="secondary" onClick={() => go(1)} disabled={i === cards.length - 1}>Next</button>
      </div>
    </div>
  );
}
