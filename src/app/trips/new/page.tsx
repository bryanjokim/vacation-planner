"use client";
// OWNED BY SLICE S1. New trip form (artboard 2). On Continue: save the Trip, go to /trips/[id]/connect.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { storage, newId } from "@/lib/storage";
import { dayColor } from "@/lib/colors";
import type { Day, Trip } from "@/lib/types";

function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  const cur = new Date(Date.UTC(ys, ms - 1, ds));
  const last = new Date(Date.UTC(ye, me - 1, de));
  while (cur <= last && out.length < 366) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

const toggleStyle = (on: boolean): React.CSSProperties => ({
  minHeight: 48,
  padding: "0 20px",
  borderRadius: 10,
  border: `1px solid ${on ? "#1F4FD8" : "#B9C0CB"}`,
  background: on ? "#E7EDFC" : "#FFFFFF",
  color: on ? "#1A3FA8" : "#14181F",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
});

export default function NewTrip() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [budget, setBudget] = useState("");
  const [kind, setKind] = useState<"address" | "suggest">("address");
  const [address, setAddress] = useState("");
  const [priorities, setPriorities] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: string[] = [];
    if (!city.trim()) errs.push("Enter a city.");
    if (!start) errs.push("Choose an arrive date.");
    if (!end) errs.push("Choose a leave date.");
    if (start && end && end < start) errs.push("The leave date must be on or after the arrive date.");
    const budgetNum = budget.trim() ? Number(budget.replace(/[$,\s]/g, "")) : 0;
    if (Number.isNaN(budgetNum) || budgetNum < 0) errs.push("Enter the budget as a number.");
    setErrors(errs);
    if (errs.length) return;

    const id = newId();
    const days: Day[] = datesBetween(start, end).map((date, index) => ({
      index,
      date,
      color: dayColor(index),
      status: "pending",
    }));
    const trip: Trip = {
      id,
      city: city.trim(),
      startDate: start,
      endDate: end,
      budget: budgetNum,
      accommodation: kind === "address" ? { kind, address: address.trim() || undefined } : { kind },
      priorities: priorities.trim(),
      status: "planning",
      days,
      blocks: [],
      existingEvents: [],
      createdAt: new Date().toISOString(),
    };
    storage.saveTrip(trip);
    router.push(`/trips/${id}/connect`);
  }

  return (
    <>
      <Header />
      <main className="page page-narrow">
        <ol className="steps">
          <li className="current" aria-current="step">1 Trip details</li>
          <li>2 Connect Google</li>
          <li>3 Generate plan</li>
        </ol>
        <h1 style={{ margin: 0, fontFamily: "var(--font-grotesk)", fontWeight: 600, fontSize: 40, lineHeight: 1.1 }}>New trip</h1>
        <form
          noValidate
          onSubmit={onSubmit}
          className="card"
          style={{ display: "flex", flexDirection: "column", gap: 24, padding: 32, background: "#FFFFFF", border: "1px solid #E3E6EB", borderRadius: 16 }}
        >
          {errors.length > 0 && (
            <div role="alert" style={{ padding: "12px 16px", borderRadius: 10, background: "#FDECEC", color: "#9B1C1C", fontSize: 14 }}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {errors.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" className="input" type="text" required value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            <div className="field" style={{ flex: "1 1 200px" }}>
              <label htmlFor="start">Arrive</label>
              <input id="start" className="input" type="date" required value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="field" style={{ flex: "1 1 200px" }}>
              <label htmlFor="end">Leave</label>
              <input id="end" className="input" type="date" required min={start || undefined} value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="field" style={{ flex: "1 1 200px" }}>
              <label htmlFor="budget">Budget (USD)</label>
              <input id="budget" className="input" type="text" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
          </div>
          <p style={{ margin: "-12px 0 0", fontSize: 14 }} className="muted">
            The plan shows estimated costs against this budget. It never blocks you from going over.
          </p>
          <fieldset style={{ margin: 0, padding: 0, border: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <legend style={{ padding: 0, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Where are you staying?</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button type="button" aria-pressed={kind === "address"} onClick={() => setKind("address")} style={toggleStyle(kind === "address")}>
                I have an address
              </button>
              <button type="button" aria-pressed={kind === "suggest"} onClick={() => setKind("suggest")} style={toggleStyle(kind === "suggest")}>
                Suggest one hotel
              </button>
            </div>
            {kind === "address" ? (
              <div className="field" style={{ marginTop: 8 }}>
                <label htmlFor="addr">Address</label>
                <input id="addr" className="input" type="text" placeholder="Street, number, city" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            ) : (
              <p className="muted" style={{ margin: "8px 0 0", fontSize: 14 }}>
                The plan picks one hotel that fits your priorities. Each day starts and ends there. Nothing is booked.
              </p>
            )}
          </fieldset>
          <div className="field">
            <label htmlFor="prio">What matters most on this trip?</label>
            <textarea id="prio" className="input" rows={4} value={priorities} onChange={(e) => setPriorities(e.target.value)} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingTop: 8 }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 8px", fontSize: 16, fontWeight: 500, color: "#3C4552" }}>
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary">Continue</button>
          </div>
        </form>
      </main>
    </>
  );
}
