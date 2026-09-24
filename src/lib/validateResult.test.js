import test from "node:test";
import assert from "node:assert/strict";
import { parseResult } from "./validateResult.js";

const good = { question: "Q?", answer: "A", options: ["A", "B"], correctIndex: 0 };

test("empty string", () => assert.equal(parseResult("  ").kind, "empty"));
test("malformed json", () => assert.equal(parseResult("{nope").kind, "malformed"));
test("wrong shape", () => assert.equal(parseResult('{"foo":1}').kind, "shape"));
test("valid", () => assert.equal(parseResult(JSON.stringify({ cards: [good] })).ok, true));
test("strips code fences", () =>
  assert.equal(parseResult("```json\n" + JSON.stringify({ cards: [good] }) + "\n```").ok, true));
test("drops bad cards, keeps good", () => {
  const r = parseResult(JSON.stringify({ cards: [good, { question: "x" }, { ...good, correctIndex: 9 }] }));
  assert.equal(r.cards.length, 1);
  assert.equal(r.dropped, 2);
});
test("all bad cards -> shape error", () =>
  assert.equal(parseResult(JSON.stringify({ cards: [{ question: "x" }] })).kind, "shape"));
