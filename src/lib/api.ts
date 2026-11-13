"use client";
// SHARED. Typed client calls. Each one falls back to the fixture when the call fails (Q5).
import type {
  Block, ExistingEvent, Option, PlanOutline, Trip, SyncResponse,
} from "./types";
import { FIXTURE_ANSWER, FIXTURE_TRIP, fixtureOptionsFor } from "./fixture";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  async outline(trip: Trip): Promise<PlanOutline> {
    try { return await post<PlanOutline>("/api/plan/outline", { trip }); }
    catch (e) { console.warn("outline fallback", e); return { days: trip.days.map((d) => ({ dayIndex: d.index, date: d.date, neighborhood: "", theme: "", mustDo: [] })) }; }
  },
  async planDay(trip: Trip, outline: PlanOutline, dayIndex: number): Promise<Block[]> {
    try { return (await post<{ blocks: Block[] }>("/api/plan/day", { trip, outline, dayIndex })).blocks; }
    catch (e) { if (trip.id !== FIXTURE_TRIP.id) throw e; console.warn("planDay fallback", e); return FIXTURE_TRIP.blocks.filter((b) => b.dayIndex === dayIndex % 3).map((b) => ({ ...b, dayIndex, id: `${b.id}-${dayIndex}`, start: trip.days[dayIndex].date + b.start.slice(10), end: trip.days[dayIndex].date + b.end.slice(10) })); }
  },
  /** Calls onChunk for each piece of the streamed answer. */
  async ask(trip: Trip, blockId: string, question: string, onChunk: (text: string) => void): Promise<void> {
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ trip, blockId, question }) });
      if (!res.ok || !res.body) throw new Error(`ask ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) { const { done, value } = await reader.read(); if (done) break; onChunk(dec.decode(value, { stream: true })); }
    } catch (e) { console.warn("ask fallback", e); onChunk(FIXTURE_ANSWER); }
  },
  async findOptions(trip: Trip, blockId: string): Promise<Option[]> {
    try { return (await post<{ options: Option[] }>("/api/options", { trip, blockId })).options; }
    catch (e) { console.warn("options fallback", e); return fixtureOptionsFor(trip.blocks.find((b) => b.id === blockId)?.kind ?? "sight"); }
  },
  async existingEvents(start: string, end: string): Promise<ExistingEvent[]> {
    try {
      const res = await fetch(`/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
      if (!res.ok) throw new Error(`events ${res.status}`);
      return ((await res.json()) as { events: ExistingEvent[] }).events;
    } catch (e) { console.warn("events fallback", e); return []; }
  },
  async sync(trip: Trip): Promise<SyncResponse | null> {
    try { return await post<SyncResponse>("/api/calendar/sync", { trip }); }
    catch (e) { console.warn("sync skipped", e); return null; }
  },
};
