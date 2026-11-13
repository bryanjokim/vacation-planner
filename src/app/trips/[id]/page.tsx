"use client";
// SHARED (skeleton). Trip workspace layout (artboard 5). Composes the S5, S6, and S7 components.
import { useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { useTrip } from "@/components/useTrip";
import { Calendar } from "@/components/workspace/Calendar";
import { RouteMap } from "@/components/workspace/RouteMap";
import { BlockPanel } from "@/components/workspace/BlockPanel";
import { OptionCards } from "@/components/workspace/OptionCards";
import type { Block, Option } from "@/lib/types";
import { api } from "@/lib/api";

export default function Workspace() {
  const { id } = useParams<{ id: string }>();
  const { trip, setTrip } = useTrip(id);
  const [dayIndex, setDayIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  if (!trip) return null;

  const block = trip.blocks.find((b) => b.id === selectedId) ?? null;
  const total = trip.blocks.reduce((s, b) => s + b.estCost, 0);
  const over = total > trip.budget;

  const saveBlock = (next: Block) => {
    const t = { ...trip, blocks: trip.blocks.map((b) => (b.id === next.id ? next : b)) };
    setTrip(t);
    if (t.googleCalendarId) void api.sync(t);
  };

  const useOption = (o: Option) => {
    if (!block) return;
    saveBlock({ ...block, title: o.title, place: o.place, estCost: o.estCost, sourceUrl: o.bookingUrl ?? o.sourceUrl, locked: true, warning: o.conflict });
    setOptions(null);
  };

  return (
    <>
      <Header />
      <main className="page" style={{ maxWidth: 1280 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h1>{trip.city} · {trip.startDate} – {trip.endDate}</h1>
            <p className="muted" style={{ margin: 0 }}>Pick a Block, then ask or find options.</p>
          </div>
          <div style={{ minWidth: 260, display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Estimated ${total} of ${trip.budget}{over ? " (over budget)" : ""}</span>
            <div aria-hidden="true" style={{ height: 10, borderRadius: 5, background: "var(--border)", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (total / Math.max(1, trip.budget)) * 100)}%`, height: 10, background: over ? "#B45309" : "var(--primary)" }} />
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", gap: 24 }} className="ws-grid">
          <Calendar
            trip={trip}
            dayIndex={dayIndex}
            onDayChange={(d) => { setDayIndex(d); setSelectedId(null); setOptions(null); }}
            selectedBlockId={selectedId}
            onSelectBlock={(bid) => { setSelectedId(bid); setOptions(null); }}
            onBlockChange={(b) => saveBlock({ ...b, locked: true })}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <RouteMap trip={trip} dayIndex={dayIndex} />
            <BlockPanel trip={trip} block={block} onOptions={setOptions} />
          </div>
        </div>
        {block && options && <OptionCards trip={trip} block={block} options={options} onUse={useOption} />}
      </main>
      <style>{`@media (max-width: 900px) { .ws-grid { grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
