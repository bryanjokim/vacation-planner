"use client";
// OWNED BY SLICE S1. Trip manager (artboard 1).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { storage } from "@/lib/storage";
import { FIXTURE_TRIP } from "@/lib/fixture";
import type { Trip, TripStatus } from "@/lib/types";

const STATUS: Record<TripStatus, { label: string; bg: string; fg: string }> = {
  planning: { label: "Planning", bg: "#EDEFF2", fg: "#3C4552" },
  draft: { label: "Draft ready", bg: "#E7EDFC", fg: "#1A3FA8" },
  accepted: { label: "Plan accepted", bg: "#E3F4EC", fg: "#0A5A40" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return { y, m, day };
}

function formatDates(start: string, end: string, dayCount: number) {
  const a = parts(start);
  const b = parts(end);
  const left = `${MONTHS[a.m - 1]} ${a.day}`;
  const right = a.m === b.m && a.y === b.y ? `${b.day}` : `${MONTHS[b.m - 1]} ${b.day}`;
  return `${left} – ${right} · ${dayCount} ${dayCount === 1 ? "day" : "days"}`;
}

function hrefFor(trip: Trip) {
  if (trip.status === "planning") return `/trips/${trip.id}/connect`;
  if (trip.status === "draft") return `/trips/${trip.id}/draft`;
  return `/trips/${trip.id}`;
}

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function TripCard({ trip }: { trip: Trip }) {
  const status = STATUS[trip.status] ?? STATUS.planning;
  const hasPlan = trip.blocks.length > 0;
  const estimated = trip.blocks.reduce((sum, b) => sum + (b.estCost || 0), 0);
  return (
    <Link
      href={hrefFor(trip)}
      style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 16, padding: 24, background: "#FFFFFF", border: "1px solid #E3E6EB", borderRadius: 16, textDecoration: "none", color: "#14181F" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: "var(--font-grotesk)", fontWeight: 600, fontSize: 26 }}>{trip.city}</h2>
        <span style={{ padding: "4px 10px", borderRadius: 999, background: status.bg, color: status.fg, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>{status.label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 15, color: "#556070" }}>{formatDates(trip.startDate, trip.endDate, trip.days.length)}</p>
      <div aria-hidden="true" style={{ display: "flex", gap: 6 }}>
        {trip.days.map((day) =>
          hasPlan ? (
            <span key={day.index} style={{ flex: 1, height: 8, borderRadius: 4, background: day.color }} />
          ) : (
            <span key={day.index} style={{ flex: 1, height: 8, borderRadius: 4, border: "1px dashed #9AA3B2", boxSizing: "border-box" }} />
          ),
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14, color: "#556070" }}>
        <span>Budget {money(trip.budget)}</span>
        <span>{hasPlan ? `Estimated ${money(estimated)}` : "No plan yet"}</span>
      </div>
    </Link>
  );
}

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    // localStorage is only readable after mount.
    setTrips(storage.listTrips().filter((t) => t.id !== FIXTURE_TRIP.id));
  }, []);

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 40px", display: "flex", flexDirection: "column", gap: 32, boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontFamily: "var(--font-grotesk)", fontWeight: 600, fontSize: 40, lineHeight: 1.1 }}>Your trips</h1>
            <p style={{ margin: 0, fontSize: 16, color: "#556070" }}>Trips are saved in this browser. Sign in later to sync a calendar.</p>
          </div>
          <Link className="btn btn-primary" href="/trips/new">New trip</Link>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          {trips.map((t) => (
            <TripCard key={t.id} trip={t} />
          ))}
          <TripCard trip={FIXTURE_TRIP} />
        </div>
      </main>
    </>
  );
}
