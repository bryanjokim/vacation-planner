"use client";
// OWNED BY SLICE S7. Selected Block with Ask and Find options (artboard 5, under the map).
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { api } from "@/lib/api";
import type { BlockPanelProps } from "./types";

type Mode = "none" | "ask" | "find";
const DEFAULT_Q = "Anything I should know before going?";
const hm = (t: string) => t.slice(11, 16);

export function BlockPanel({ trip, block, onOptions }: BlockPanelProps) {
  const [mode, setMode] = useState<Mode>("none");
  const [question, setQuestion] = useState(DEFAULT_Q);
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [finding, setFinding] = useState(false);
  const [found, setFound] = useState<number | null>(null);
  const req = useRef(0);

  const blockId = block?.id ?? null;
  useEffect(() => {
    req.current++;
    setMode("none");
    setQuestion(DEFAULT_Q);
    setAsked(null);
    setAnswer("");
    setAsking(false);
    setFinding(false);
    setFound(null);
  }, [blockId]);

  if (!block) {
    return (
      <section className="card" style={{ padding: 16 }}>
        <p className="muted" style={{ margin: 0 }}>Pick a Block on the calendar, then ask or find options.</p>
      </section>
    );
  }

  async function send() {
    if (!block || !question.trim()) return;
    const id = ++req.current;
    setAsked(question);
    setAnswer("");
    setAsking(true);
    await api.ask(trip, block.id, question, (t) => {
      if (req.current === id) setAnswer((a) => a + t);
    });
    if (req.current === id) setAsking(false);
  }

  async function find() {
    if (!block) return;
    const id = ++req.current;
    setFinding(true);
    setFound(null);
    const opts = await api.findOptions(trip, block.id);
    if (req.current !== id) return;
    setFinding(false);
    setFound(opts.length);
    onOptions(opts);
  }

  const switchTo = (m: Mode) => {
    if (m === mode) return;
    if (mode === "find") {
      req.current++;
      setFinding(false);
      onOptions(null);
    }
    setMode(m);
    if (m === "find") void find();
  };

  const toggle = (active: boolean): CSSProperties => ({
    minHeight: 44, padding: "0 20px", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer",
    border: `1px solid ${active ? "#14181F" : "#B9C0CB"}`,
    background: active ? "#14181F" : "#FFFFFF",
    color: active ? "#FFFFFF" : "#14181F",
  });

  return (
    <section className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 13, color: "#556070" }}>
          Day {block.dayIndex + 1} · {hm(block.start)} – {hm(block.end)}
        </div>
        <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 24, lineHeight: 1.2 }}>{block.title}</h2>
        <div style={{ fontSize: 14, color: "#556070" }}>Estimated ${block.estCost}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" aria-pressed={mode === "ask"} style={toggle(mode === "ask")} onClick={() => switchTo("ask")}>
          Ask
        </button>
        <button type="button" aria-pressed={mode === "find"} style={toggle(mode === "find")} onClick={() => switchTo("find")}>
          Find options
        </button>
      </div>
      {mode === "ask" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <form
            style={{ display: "flex", gap: 8 }}
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              aria-label="Question"
              className="input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button type="submit" className="btn btn-dark" disabled={asking || !question.trim()}>
              Send
            </button>
          </form>
          {asked && (
            <div aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16, borderRadius: 12, background: "#F5F6F8" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#556070" }}>You asked: {asked}</div>
              <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.55 }}>
                {answer || (asking ? "…" : "")}
              </p>
            </div>
          )}
        </div>
      )}
      {mode === "find" && (
        <p aria-live="polite" style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "#556070" }}>
          {finding
            ? "Finding options…"
            : found !== null
              ? `${found} options are below the calendar. Use one and this Block updates in place.`
              : null}
        </p>
      )}
    </section>
  );
}
