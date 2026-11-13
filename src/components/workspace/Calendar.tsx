"use client";
// OWNED BY SLICE S5. Calendar with Day tabs, Existing events layer, Block selection (artboard 5, left).
import type { CalendarProps } from "./types";

export function Calendar({ trip, dayIndex, onDayChange, selectedBlockId, onSelectBlock }: CalendarProps) {
  return (
    <section className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {trip.days.map((d) => (
          <button key={d.index} className="btn" aria-pressed={d.index === dayIndex} onClick={() => onDayChange(d.index)}>Day {d.index + 1}</button>
        ))}
      </div>
      <ul>
        {trip.blocks.filter((b) => b.dayIndex === dayIndex).map((b) => (
          <li key={b.id}><button aria-pressed={b.id === selectedBlockId} onClick={() => onSelectBlock(b.id)}>{b.start.slice(11)} {b.title}</button></li>
        ))}
      </ul>
    </section>
  );
}
