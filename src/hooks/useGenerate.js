import { useRef, useState } from "react";
import { parseResult } from "../lib/validateResult";

const CLIENT_TIMEOUT_MS = 60000;

export function useGenerate() {
  const [state, setState] = useState({ status: "idle", cards: [], error: null, dropped: 0, resultId: 0 });
  const requestId = useRef(0);
  const controllerRef = useRef(null);

  async function generate(input) {
    const id = ++requestId.current; // newest request owns the UI
    controllerRef.current?.abort(); // cancel older in-flight request
    const controller = new AbortController();
    controllerRef.current = controller;
    const timer = setTimeout(() => controller.abort("timeout"), CLIENT_TIMEOUT_MS);

    setState((s) => ({ ...s, status: "loading", cards: [], error: null, dropped: 0 }));
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
        signal: controller.signal,
      });
      const body = await res.json().catch(() => ({}));
      if (id !== requestId.current) return; // stale, ignore
      if (!res.ok)
        return setState((s) => ({ ...s, status: "error", cards: [], error: body.error || "Request failed.", dropped: 0 }));

      let parsed = parseResult(body.content);

      if (!parsed.ok && body.content?.trim()) {
        const retryRes = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input, repair: { previous: body.content, problem: parsed.message } }),
          signal: controller.signal,
        });
        const retryBody = await retryRes.json().catch(() => ({}));
        if (id !== requestId.current) return; // still guard against stale results
        if (retryRes.ok) parsed = parseResult(retryBody.content);
      }
      if (!parsed.ok) return setState((s) => ({ ...s, status: "error", cards: [], error: parsed.message, dropped: 0 }));
      setState({ status: "success", cards: parsed.cards, error: null, dropped: parsed.dropped, resultId: id });
    } catch (e) {
      if (id !== requestId.current) return; // superseded, not an error
      const timedOut = controller.signal.reason === "timeout";
      setState((s) => ({
        ...s,
        status: "error",
        cards: [],
        error: timedOut ? "The request timed out." : "Network error. Check your connection.",
        dropped: 0,
      }));
    } finally {
      clearTimeout(timer);
    }
  }

  return { ...state, generate };
}
