import { useState } from "react";

export default function PromptInput({ onSubmit, disabled }) {
  const [text, setText] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (text.trim()) onSubmit(text.trim());
  };
  
  return (
    <form onSubmit={submit} className="prompt">
      <label htmlFor="notes">Paste your notes or a topic</label>
      <textarea
        id="notes"
        rows={6}
        value={text}
        maxLength={8000}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Photosynthesis, or paste a chapter of notes…"
      />
      <button type="submit" disabled={disabled || !text.trim()}>
        {disabled ? "Generating…" : "Generate study set"}
      </button>
    </form>
  );
}
