"use client";
// OWNED BY SLICE S7. Option cards in a row under the calendar (artboard 5, bottom).
import type { OptionCardsProps } from "./types";

export function OptionCards({ options, onUse }: OptionCardsProps) {
  return (
    <section style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {options.map((o) => (
        <article key={o.id} className="card" style={{ padding: 16, flex: "1 1 280px" }}>
          <h3>{o.title}</h3>
          <button className="btn btn-dark" onClick={() => onUse(o)}>Use this</button>
        </article>
      ))}
    </section>
  );
}
