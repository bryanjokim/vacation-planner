"use client";
// OWNED BY SLICE S5. Calendar with Day tabs, Existing events layer, Block selection (artboard 5, left).
import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Block } from "@/lib/types";
import { dayColor } from "@/lib/colors";
import type { CalendarProps } from "./types";

const START_HOUR = 8;
const END_HOUR = 22;
const PX_PER_HOUR = 48;
const SNAP_MIN = 15;

/** "YYYY-MM-DDTHH:mm" -> hours as a decimal (e.g. 9.5). */
const toHours = (t: string) => Number(t.slice(11, 13)) + Number(t.slice(14, 16)) / 60;
const px = (h: number) => (h - START_HOUR) * PX_PER_HOUR;
const fmt = (h: number) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const ap = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ap}`;
};
const hourLabel = (h: number) => (h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`);
const toLocal = (date: string, h: number) => {
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${date}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};
const snap = (h: number) => Math.round((h * 60) / SNAP_MIN) * SNAP_MIN / 60;
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

interface Drag {
  id: string;
  mode: "move" | "resize";
  startY: number;
  s: number;
  e: number;
  moved: boolean;
}

export function Calendar({ trip, dayIndex, onDayChange, selectedBlockId, onSelectBlock, onBlockChange }: CalendarProps) {
  const day = trip.days.find((d) => d.index === dayIndex) ?? trip.days[0];
  const color = day?.color ?? dayColor(dayIndex);
  const date = day?.date ?? "";
  const drag = useRef<Drag | null>(null);
  const [preview, setPreview] = useState<{ id: string; s: number; e: number } | null>(null);

  const exts = trip.existingEvents
    .filter((e) => e.start.slice(0, 10) === date)
    .map((e) => ({ ...e, s: toHours(e.start), e2: toHours(e.end) }));
  const blocks = trip.blocks.filter((b) => b.dayIndex === dayIndex);

  const onPointerDown = (ev: ReactPointerEvent<HTMLElement>, b: Block, mode: Drag["mode"]) => {
    if (ev.button !== 0) return;
    if (mode === "resize") ev.stopPropagation();
    ev.currentTarget.setPointerCapture(ev.pointerId);
    drag.current = { id: b.id, mode, startY: ev.clientY, s: toHours(b.start), e: toHours(b.end), moved: false };
  };
  const onPointerMove = (ev: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dy = ev.clientY - d.startY;
    if (!d.moved && Math.abs(dy) < 4) return;
    d.moved = true;
    const dh = snap(dy / PX_PER_HOUR);
    const len = d.e - d.s;
    let s = d.s;
    let e = d.e;
    if (d.mode === "move") {
      s = Math.min(Math.max(START_HOUR, d.s + dh), END_HOUR - len);
      e = s + len;
    } else {
      e = Math.min(Math.max(d.s + SNAP_MIN / 60, d.e + dh), END_HOUR);
    }
    setPreview({ id: d.id, s, e });
  };
  const onPointerUp = (b: Block) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) {
      onSelectBlock(b.id);
      setPreview(null);
      return;
    }
    const p = preview && preview.id === b.id ? preview : null;
    setPreview(null);
    if (p && (p.s !== d.s || p.e !== d.e)) {
      const bd = b.start.slice(0, 10);
      onBlockChange({ ...b, start: toLocal(bd, p.s), end: toLocal(bd, p.e) });
    }
  };

  const hours: number[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) hours.push(h);

  return (
    <section style={{ flex: "999 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16, padding: "20px 24px 24px", background: "#FFFFFF", border: "1px solid #E3E6EB", borderRadius: 16, boxSizing: "border-box" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {trip.days.map((d) => {
          const sel = d.index === dayIndex;
          return (
            <button
              key={d.index}
              type="button"
              aria-pressed={sel}
              onClick={() => onDayChange(d.index)}
              style={{ display: "inline-flex", alignItems: "center", gap: 10, minHeight: 44, padding: "0 16px", borderRadius: 10, border: `1px solid ${sel ? "#14181F" : "#C9CED6"}`, background: sel ? "#14181F" : "#FFFFFF", color: sel ? "#FFFFFF" : "#14181F", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              <span aria-hidden="true" style={{ display: "inline-block", width: 12, height: 12, borderRadius: 6, border: "2px solid #FFFFFF", background: d.color }} />
              Day {d.index + 1} · {d.date}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", fontSize: 13, color: "#556070" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden="true" style={{ display: "inline-block", width: 14, height: 14, borderRadius: 4, background: color }} />
          Trip Blocks
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden="true" style={{ display: "inline-block", width: 14, height: 14, borderRadius: 4, background: "#E9ECF1", border: "1px dashed #7C8696" }} />
          Your other Google Calendar events
        </span>
      </div>
      <div style={{ padding: "12px 0" }}>
        <div style={{ position: "relative", height: (END_HOUR - START_HOUR) * PX_PER_HOUR }}>
          {hours.map((h) => (
            <div key={h} aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: px(h), height: 0, borderTop: "1px solid #E3E6EB" }}>
              <span style={{ position: "absolute", left: 0, top: -9, width: 52, paddingRight: 8, boxSizing: "border-box", textAlign: "right", fontSize: 12, color: "#556070", background: "#FFFFFF" }}>{hourLabel(h)}</span>
            </div>
          ))}
          {exts.map((e) => (
            <div key={e.id} style={{ position: "absolute", top: px(e.s), height: (e.e2 - e.s) * PX_PER_HOUR - 2, right: 8, width: "28%", boxSizing: "border-box", padding: "6px 10px", borderRadius: 8, border: "1px dashed #7C8696", background: "#E9ECF1", color: "#3C4552", fontSize: 12, lineHeight: 1.3, overflow: "hidden", pointerEvents: "none" }}>
              <div style={{ fontWeight: 600 }}>{e.title}</div>
              <div>{fmt(e.s)} – {fmt(e.e2)}</div>
            </div>
          ))}
          {blocks.map((b) => {
            const p = preview && preview.id === b.id ? preview : null;
            const s = p ? p.s : toHours(b.start);
            const e = p ? p.e : toHours(b.end);
            const sel = b.id === selectedBlockId;
            const hit = exts.find((x) => x.s < e && x.e2 > s);
            const conflict = hit ? `Overlaps ${hit.title}` : b.warning ?? "";
            return (
              <button
                key={b.id}
                type="button"
                aria-pressed={sel}
                onClick={(ev) => {
                  // Pointer handlers select on a plain click; keyboard activation (detail 0) selects here.
                  if (ev.detail === 0) onSelectBlock(b.id);
                }}
                onPointerDown={(ev) => onPointerDown(ev, b, "move")}
                onPointerMove={onPointerMove}
                onPointerUp={() => onPointerUp(b)}
                onPointerCancel={() => { drag.current = null; setPreview(null); }}
                style={{ position: "absolute", top: px(s), height: Math.max(18, (e - s) * PX_PER_HOUR - 2), left: 60, right: "calc(28% + 20px)", boxSizing: "border-box", padding: "6px 12px", border: 0, borderRadius: 8, background: color, color: "#FFFFFF", textAlign: "left", cursor: p ? "grabbing" : "pointer", overflow: "hidden", display: "flex", flexDirection: "column", gap: 2, boxShadow: sel ? "0 0 0 2px #FFFFFF, 0 0 0 5px #14181F" : "none", touchAction: "none", zIndex: p ? 2 : 1 }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25 }}>{b.title}</span>
                <span style={{ fontSize: 12, lineHeight: 1.3 }}>{fmt(s)} – {fmt(e)} · {money(b.estCost)}</span>
                {conflict && (
                  <span style={{ marginTop: 4, alignSelf: "flex-start", padding: "2px 8px", borderRadius: 6, background: "#FFFFFF", color: "#8A3B00", fontSize: 12, fontWeight: 600 }}>{conflict}</span>
                )}
                <span
                  aria-hidden="true"
                  onPointerDown={(ev) => onPointerDown(ev, b, "resize")}
                  style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 8, cursor: "ns-resize" }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
