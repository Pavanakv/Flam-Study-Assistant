import { useState } from "react";

export default function Quiz({ cards }) {
  const [deck, setDeck] = useState(cards);
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState(null);
  const [wrongIds, setWrongIds] = useState([]);
  const [score, setScore] = useState(0);

  const reset = (newDeck) => {
    setDeck(newDeck);
    setI(0);
    setSelected(null);
    setWrongIds([]);
    setScore(0);
  };

  if (i >= deck.length) {
    const wrongCards = deck.filter((c) => wrongIds.includes(c.id));
    return (
      <div className="panel center">
        <h2>{score} / {deck.length} correct</h2>
        {wrongCards.length > 0 && (
          <button onClick={() => reset(wrongCards)}>Re-test {wrongCards.length} wrong answer{wrongCards.length > 1 ? "s" : ""}</button>
        )}
        <button className="secondary" onClick={() => reset(cards)}>Restart full quiz</button>
      </div>
    );
  }

  const q = deck[i];
  const answered = selected !== null;

  const pick = (idx) => {
    if (answered) return;
    setSelected(idx);
    if (idx === q.correctIndex) setScore((s) => s + 1);
    else setWrongIds((w) => [...w, q.id]);
  };

  return (
    <div className="panel">
      <p className="muted">Question {i + 1} of {deck.length}</p>
      <h2>{q.question}</h2>
      <div className="options">
        {q.options.map((o, idx) => {
          let cls = "option";
          if (answered && idx === q.correctIndex) cls += " correct";
          else if (answered && idx === selected) cls += " wrong";
          return (
            <button key={idx} className={cls} onClick={() => pick(idx)} disabled={answered}>{o}</button>
          );
        })}
      </div>
      {answered && (
        <button onClick={() => { setI((n) => n + 1); setSelected(null); }}>
          {i === deck.length - 1 ? "See results" : "Next question"}
        </button>
      )}
    </div>
  );
}
