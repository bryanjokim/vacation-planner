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
    flex: 1,
    background: active ? "#0F1729" : undefined,
    color: active ? "#fff" : undefined,
  });

  return (
    <section className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div className="muted" style={{ fontSize: 13 }}>
          Day {block.dayIndex + 1} · {hm(block.start)} – {hm(block.end)}
        </div>
        <h3 style={{ margin: "4px 0" }}>{block.title}</h3>
        <div className="muted" style={{ fontSize: 13 }}>Estimated ${block.estCost}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="btn" aria-pressed={mode === "ask"} style={toggle(mode === "ask")} onClick={() => switchTo("ask")}>
          Ask
        </button>
        <button type="button" className="btn" aria-pressed={mode === "find"} style={toggle(mode === "find")} onClick={() => switchTo("find")}>
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
            <div aria-live="polite">
              <div className="muted" style={{ fontSize: 13 }}>You asked: {asked}</div>
              <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.5 }}>
                {answer || (asking ? "…" : "")}
              </p>
            </div>
          )}
        </div>
      )}
      {mode === "find" && (
        <p aria-live="polite" style={{ margin: 0, fontSize: 14 }}>
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
