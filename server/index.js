import express from "express";
import "dotenv/config";

const app = express();
app.use(express.json({ limit: "50kb" }));

const SYSTEM = `You generate study material. Return ONLY valid JSON, no prose, no markdown fences, in this exact shape:
{"cards":[{"question":string,"answer":string,"options":[string,string,string,string],"correctIndex":number}]}
Generate 8 cards from the user's notes or topic. "answer" must equal options[correctIndex].`;

app.post("/api/generate", async (req, res) => {
  const input = (req.body?.input ?? "").trim();
  if (!input) return res.status(400).json({ error: "Input is empty." });
  if (input.length > 8000) return res.status(400).json({ error: "Input too long (max 8000 characters)." });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: "Server is missing GROQ_API_KEY." });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: input },
        ],
      }),
    });
    if (!r.ok) {
      console.error("Groq error:", r.status, await r.text());
      return res.status(502).json({ error: `Model API failed (${r.status}).` });
    }
    const data = await r.json();
    // Raw text goes to the client; the client parses and validates it.
    res.json({ content: data.choices?.[0]?.message?.content ?? "" });
  } catch (e) {
    const timedOut = e.name === "AbortError";
    res.status(timedOut ? 504 : 500).json({ error: timedOut ? "The model took too long." : "Server error." });
  } finally {
    clearTimeout(timer);
  }
});

app.listen(3001, () => console.log("API server on http://localhost:3001"));
