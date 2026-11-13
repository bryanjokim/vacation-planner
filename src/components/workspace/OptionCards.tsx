"use client";
// OWNED BY SLICE S7. Option cards in a row under the calendar (artboard 5, bottom).
import type { CSSProperties } from "react";
import { dayColor } from "@/lib/colors";
import type { OptionCardsProps } from "./types";

const WARN = "#8A3B00";
const GOOD = "#0A5A40";

function money(n: number) {
  return `$${Math.abs(Math.round(n))}`;
}

function RoutePreview({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 48" width="100%" height="48" aria-hidden="true" style={{ display: "block" }}>
      <path d="M12 36 C 60 8, 100 44, 140 24 S 210 12, 228 20" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="5 4" />
      <circle cx="12" cy="36" r="5" fill="#fff" stroke={color} strokeWidth="2.5" />
      <circle cx="140" cy="24" r="6" fill={color} />
      <circle cx="228" cy="20" r="5" fill="#fff" stroke={color} strokeWidth="2.5" />
    </svg>
  );
}

const dt: CSSProperties = { color: "#5B6475", fontSize: 13 };
const dd: CSSProperties = { margin: 0, fontSize: 13, textAlign: "right" };

export function OptionCards({ block, options, onUse }: OptionCardsProps) {
  const color = dayColor(block.dayIndex);
  const at = block.start.slice(11, 16);
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 24 }}>Options for &ldquo;{block.title}&rdquo;</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {options.map((o) => {
          const delta = o.estCost - block.estCost;
          const travel =
            o.extraMinutes != null || o.extraKm != null
              ? [o.extraMinutes != null ? `+${o.extraMinutes} min` : null, o.extraKm != null ? `${o.extraKm} km` : null]
                  .filter(Boolean)
                  .join(" · ")
              : "Unknown";
          const open = o.openAtTime == null ? "Unknown" : o.openAtTime ? "Open" : "Closed";
          return (
            <article key={o.id} className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>{o.title}</h3>
              {o.reason && <p className="muted" style={{ margin: 0, fontSize: 13 }}>{o.reason}</p>}
              <RoutePreview color={color} />
              <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", margin: 0 }}>
                <dt style={dt}>Rating</dt>
                <dd style={dd}>{o.place.rating != null ? `${o.place.rating} ★` : "Unknown"}</dd>
                <dt style={dt}>Price</dt>
                <dd style={dd}>
                  {o.place.priceLevel ?? "—"} ·{" "}
                  <span style={{ color: delta > 0 ? WARN : GOOD }}>
                    {delta > 0 ? "+" : "−"}
                    {money(delta)} budget
                  </span>
                </dd>
                <dt style={dt}>Extra travel</dt>
                <dd style={dd}>{travel}</dd>
                <dt style={dt}>At {at}</dt>
                <dd style={{ ...dd, color: o.openAtTime === false ? WARN : undefined }}>{open}</dd>
                <dt style={dt}>Weather</dt>
                <dd style={dd}>
                  {o.indoor ? "Indoor" : "Outdoor"}
                  {o.forecast ? ` · ${o.forecast}` : ""}
                </dd>
                <dt style={dt}>Conflicts</dt>
                <dd style={{ ...dd, color: o.conflict ? WARN : undefined }}>{o.conflict ?? "No conflicts"}</dd>
              </dl>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: "auto" }}>
                <button type="button" className="btn btn-dark" onClick={() => onUse(o)}>
                  Use this
                </button>
                {o.sourceUrl && (
                  <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn">
                    Website
                  </a>
                )}
                {o.bookingUrl && (
                  <a href={o.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn">
                    Reserve
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
