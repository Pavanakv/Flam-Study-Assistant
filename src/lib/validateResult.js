
export function parseResult(raw) {
  if (typeof raw !== "string" || !raw.trim())
    return { ok: false, kind: "empty", message: "The model returned nothing." };

  
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

  let data;
  try {
    data = JSON.parse(cleaned);
  } catch {
    return { ok: false, kind: "malformed", message: "The model returned invalid JSON." };
  }

  if (!Array.isArray(data?.cards) || data.cards.length === 0)
    return { ok: false, kind: "shape", message: "The response was missing cards." };

  
  const cards = data.cards
    .filter(
      (c) =>
        typeof c?.question === "string" && c.question.trim() &&
        typeof c?.answer === "string" && c.answer.trim() &&
        Array.isArray(c?.options) && c.options.length >= 2 &&
        c.options.every((o) => typeof o === "string") &&
        Number.isInteger(c?.correctIndex) &&
        c.correctIndex >= 0 && c.correctIndex < c.options.length
    )
    .map((c, i) => ({ ...c, id: i }));

  if (cards.length === 0)
    return { ok: false, kind: "shape", message: "None of the cards were usable. Try again." };

  return { ok: true, cards, dropped: data.cards.length - cards.length };
}
