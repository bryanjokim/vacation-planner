// OWNED BY SLICE S4. Draft plan (artboard 4). Runs outline + parallel Day calls, then "Accept draft".
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useTrip } from "@/components/useTrip";
import { api } from "@/lib/api";
import type { Block, Day, DayStatus, PlanOutline, Trip } from "@/lib/types";

const DAY_TIMEOUT_MS = 120_000;
const BORDER = "#E3E6EB";
const MUTED = "#556070";

function hm(t: string) {
  const s = t.slice(11, 16);
  return s.startsWith("0") ? s.slice(1) : s;
}

function dayLabel(date: string) {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).replace(",", "");
}

function shortDate(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

export default function Draft() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { trip, setTrip } = useTrip(id);
  const tripRef = useRef<Trip | null>(null);
  const outlineRef = useRef<PlanOutline | null>(null);
  const started = useRef(false);
  const [dayStatus, setDayStatus] = useState<Record<number, DayStatus>>({});
  const [outlining, setOutlining] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => { tripRef.current = trip; }, [trip]);

  const save = useCallback((next: Trip) => {
    tripRef.current = next;
    setTrip(next);
  }, [setTrip]);

  const runDay = useCallback(async (i: number) => {
    const outline = outlineRef.current;
    const base = tripRef.current;
    if (!outline || !base) return;
    setDayStatus((s) => ({ ...s, [i]: "loading" }));
    try {
      const blocks = await withTimeout(api.planDay(base, outline, i), DAY_TIMEOUT_MS);
      const cur = tripRef.current ?? base;
      const kept = cur.blocks.filter((b) => b.dayIndex !== i || b.locked);
      const fresh = blocks.map((b) => ({ ...b, dayIndex: i }));
      const days = cur.days.map((d) => (d.index === i ? { ...d, status: "ready" as DayStatus } : d));
      const allReady = days.every((d) => d.status === "ready");
      save({ ...cur, blocks: [...kept, ...fresh], days, status: allReady ? "draft" : cur.status });
      setDayStatus((s) => ({ ...s, [i]: "ready" }));
    } catch (e) {
      console.warn("day failed", i, e);
      const cur = tripRef.current ?? base;
      save({ ...cur, days: cur.days.map((d) => (d.index === i ? { ...d, status: "failed" as DayStatus } : d)) });
      setDayStatus((s) => ({ ...s, [i]: "failed" }));
    }
  }, [save]);

  const generate = useCallback(async () => {
    const base = tripRef.current;
    if (!base) return;
    setOutlining(true);
    setDayStatus(Object.fromEntries(base.days.map((d) => [d.index, "loading" as DayStatus])));
    const outline = await api.outline(base);
    outlineRef.current = outline;
    const days: Day[] = base.days.map((d) => {
      const o = outline.days.find((x) => x.dayIndex === d.index);
      return { ...d, neighborhood: o?.neighborhood || d.neighborhood, theme: o?.theme || d.theme, status: "loading" };
    });
    const next: Trip = {
      ...base,
      days,
      accommodation: outline.suggestedAccommodation
        ? { ...base.accommodation, place: outline.suggestedAccommodation }
        : base.accommodation,
    };
    save(next);
    setOutlining(false);
    await Promise.all(days.map((d) => runDay(d.index)));
  }, [runDay, save]);

  useEffect(() => {
    if (!trip || started.current) return;
    started.current = true;
    tripRef.current = trip;
    if (trip.blocks.length > 0) {
      setDayStatus(Object.fromEntries(trip.days.map((d) => [d.index, "ready" as DayStatus])));
    } else {
      void generate();
    }
  }, [trip, generate]);

  const retry = (i: number) => {
    if (!outlineRef.current) { void generate(); return; }
    void runDay(i);
  };

  const accept = async () => {
    const cur = tripRef.current;
    if (!cur) return;
    setAccepting(true);
    try {
      let next: Trip = { ...cur, status: "accepted" };
      const res = await api.sync(next);
      if (res) {
        next = {
          ...next,
          googleCalendarId: res.calendarId,
          blocks: next.blocks.map((b) => (res.eventIds[b.id] ? { ...b, googleEventId: res.eventIds[b.id] } : b)),
        };
      }
      save(next);
      router.push(`/trips/${id}`);
    } catch (e) {
      console.warn("accept failed", e);
      setAccepting(false);
    }
  };

  if (!trip) {
    return (<><Header /><main className="page"><p className="muted">Loading trip…</p></main></>);
  }

  const total = trip.blocks.reduce((s, b) => s + (b.estCost || 0), 0);
  const pct = trip.budget > 0 ? Math.min(100, (total / trip.budget) * 100) : 0;
  const busy = outlining || Object.values(dayStatus).some((s) => s === "loading");

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 64px", display: "flex", flexDirection: "column", gap: 28, boxSizing: "border-box", width: "100%" }}>
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexWrap: "wrap", gap: "8px 20px", fontSize: 14, color: MUTED }}>
          <li>1 Trip details</li>
          <li>2 Connect Google</li>
          <li aria-current="step" style={{ fontWeight: 600, color: "#14181F" }}>3 Generate plan</li>
        </ol>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 40, lineHeight: 1.1 }}>Draft plan for {trip.city}</h1>
              <span style={{ padding: "4px 10px", borderRadius: 999, background: "#E7EDFC", color: "#1A3FA8", fontSize: 13, fontWeight: 500 }}>Draft</span>
            </div>
            <p style={{ margin: 0, fontSize: 16, color: MUTED }}>
              {shortDate(trip.startDate)} – {shortDate(trip.endDate)}. Each day starts and ends at your hotel. Accept the draft to put it on your calendar and edit it.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={() => void generate()} disabled={busy || accepting}
              style={{ minHeight: 48, padding: "0 22px", border: "1px solid #B9C0CB", borderRadius: 12, background: "#FFFFFF", color: "#14181F", fontSize: 16, fontWeight: 600, cursor: busy ? "default" : "pointer", opacity: busy || accepting ? 0.6 : 1 }}>
              Regenerate
            </button>
            <button type="button" onClick={() => void accept()} disabled={accepting || busy}
              style={{ display: "inline-flex", alignItems: "center", minHeight: 48, padding: "0 28px", border: "none", borderRadius: 12, background: "#1F4FD8", color: "#FFFFFF", fontWeight: 600, fontSize: 16, cursor: accepting ? "default" : "pointer", opacity: accepting || busy ? 0.6 : 1 }}>
              {accepting ? "Accepting…" : "Accept draft"}
            </button>
          </div>
        </div>

        <section aria-label="Estimated cost" style={{ display: "flex", flexDirection: "column", gap: 10, padding: "20px 24px", background: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 15 }}>
            <span style={{ fontWeight: 600 }}>Estimated ${Math.round(total)} of ${trip.budget}</span>
            <span style={{ color: MUTED }}>Estimates for food and activities. Not enforced.</span>
          </div>
          <div aria-hidden="true" style={{ height: 10, borderRadius: 5, background: BORDER, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: 10, background: "#1F4FD8" }} />
          </div>
        </section>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          {trip.days.map((day) => {
            const status = dayStatus[day.index] ?? (day.status === "pending" ? "loading" : day.status);
            const blocks = trip.blocks.filter((b) => b.dayIndex === day.index).sort((a, b) => a.start.localeCompare(b.start));
            const cost = blocks.reduce((s, b) => s + (b.estCost || 0), 0);
            return (
              <DayColumn key={day.index} day={day} status={status} blocks={blocks} cost={cost} onRetry={() => retry(day.index)} />
            );
          })}
        </div>
      </main>
    </>
  );
}

function DayColumn({ day, status, blocks, cost, onRetry }: { day: Day; status: DayStatus; blocks: Block[]; cost: number; onRetry: () => void }) {
  const n = day.index + 1;
  return (
    <section aria-label={`Day ${n}`} aria-busy={status === "loading"} style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", background: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", background: day.color, color: "#FFFFFF", display: "flex", justifyContent: "space-between", gap: 12, fontWeight: 600 }}>
        <span>Day {n} · {dayLabel(day.date)}</span>
        <span>{status === "ready" ? `$${Math.round(cost)}` : ""}</span>
      </div>
      {status === "loading" && (
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div role="status" style={{ fontSize: 14, color: MUTED }}>Planning Day {n}…</div>
          {[0, 1, 2, 3].map((k) => (
            <div key={k} aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ width: 80, height: 10, borderRadius: 5, background: "#EEF0F3" }} />
              <div style={{ width: `${60 + ((k * 13) % 30)}%`, height: 14, borderRadius: 7, background: "#E3E6EB" }} />
            </div>
          ))}
        </div>
      )}
      {status === "failed" && (
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
          <p role="alert" style={{ margin: 0, fontSize: 15, color: "#8A3B00" }}>Day {n} could not be planned.</p>
          <button type="button" onClick={onRetry}
            style={{ minHeight: 44, padding: "0 18px", border: "1px solid #B9C0CB", borderRadius: 12, background: "#FFFFFF", color: "#14181F", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Retry this Day
          </button>
        </div>
      )}
      {status !== "loading" && status !== "failed" && (
        <ul style={{ margin: 0, padding: "8px 24px 16px", listStyle: "none", display: "flex", flexDirection: "column" }}>
          {blocks.length === 0 && <li style={{ padding: "12px 0", color: MUTED }}>Nothing planned yet.</li>}
          {blocks.map((b, i) => (
            <li key={b.id} style={{ padding: i === blocks.length - 1 ? "12px 0 0" : "12px 0", borderBottom: i === blocks.length - 1 ? "none" : `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 13, color: MUTED }}>{hm(b.start)} – {hm(b.end)}</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{b.title}</div>
              {b.warning && <div style={{ fontSize: 13, color: "#8A3B00", fontWeight: 500, marginTop: 2 }}>{b.warning}</div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
