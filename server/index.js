import path from "node:path";
import { fileURLToPath } from "node:url";
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

  // Dev-only failure simulation for demos and testing (ignored in production)
  const sim = process.env.NODE_ENV === "production" ? null : req.body?.simulate;
  const isRepair = Boolean(req.body?.repair);
  if (sim === "empty") return res.json({ content: "" });
  if (sim === "malformed") return res.json({ content: "sure! {oops" });
  if (sim === "shape") return res.json({ content: '{"foo":1}' });
  if (sim === "repair-demo" && !isRepair) return res.json({ content: "sure! {oops" });
  if (sim === "fail") return res.status(502).json({ error: "Model API failed (simulated)." });
  if (sim === "timeout") return res.status(504).json({ error: "The model took too long." });
  if (sim === "slow") await new Promise((r) => setTimeout(r, 6000));


  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: input },
  ];
  const repair = req.body?.repair;
  if (
    repair &&
    typeof repair.previous === "string" && repair.previous.trim() &&
    typeof repair.problem === "string"
  ) {
    messages.push(
      { role: "assistant", content: repair.previous.slice(0, 20000) },
      { role: "user", content: `Your last reply was not usable: ${repair.problem.slice(0, 200)} Return ONLY the corrected JSON in the required shape.` }
    );
  }

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
        messages: messages,
      }),
    });
    if (!r.ok) {
      console.error("Groq error:", r.status, await r.text());
      return res.status(502).json({ error: `Model API failed (${r.status}).` });
    }
    const data = await r.json();
    
    res.json({ content: data.choices?.[0]?.message?.content ?? "" });
  } catch (e) {
    const timedOut = e.name === "AbortError";
    res.status(timedOut ? 504 : 500).json({ error: timedOut ? "The model took too long." : "Server error." });
  } finally {
    clearTimeout(timer);
  }
});

if (process.env.NODE_ENV === "production") {
  const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "../dist");
  app.use(express.static(dist));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
