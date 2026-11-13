// OWNED BY SLICE S2. Connect Google (artboard 3). "Generate plan" goes to /trips/[id]/draft.
"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { Header } from "@/components/Header";
import { useTrip } from "@/components/useTrip";
import { api } from "@/lib/api";

function fmtRange(start: string, end: string) {
  const f = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return start === end ? f(start) : `${f(start)} – ${f(end)}`;
}

export default function Connect() {
  const { id } = useParams<{ id: string }>();
  const { trip, setTrip } = useTrip(id);
  const [signed, setSigned] = useState<boolean | null>(null);
  const [imported, setImported] = useState<number | null>(null);
  const importedFor = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => setSigned(!!s?.user))
      .catch(() => setSigned(false));
  }, []);

  useEffect(() => {
    if (!signed || !trip || importedFor.current === trip.id) return;
    importedFor.current = trip.id;
    api.existingEvents(trip.startDate + "T00:00", trip.endDate + "T23:59").then((events) => {
      setTrip({ ...trip, existingEvents: events });
      setImported(events.length);
    });
  }, [signed, trip, setTrip]);

  const city = trip?.city ?? "your city";

  return (
    <>
      <Header />
      <main className="page page-narrow">
        <ol className="steps">
          <li>1 Trip details</li>
          <li className="current" aria-current="step">2 Connect Google</li>
          <li>3 Generate plan</li>
        </ol>
        <h1>Connect your Google Calendar</h1>

        <section className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ margin: 0 }}>
            Creates a calendar named &quot;Trip: {city}&quot; for this plan. Edits in the app and in Google Calendar stay in sync.
          </p>
          <p style={{ margin: 0 }}>
            Reads your existing events and shows them as a second layer, so the plan works around them.
          </p>

          {signed === false && (
            <div>
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => signIn("google", { callbackUrl: window.location.href })}
              >
                Continue with Google
              </button>
            </div>
          )}

          {signed && (
            <div
              role="status"
              style={{ padding: 16, borderRadius: 12, background: "#E7F5EE", border: "1px solid #0B7A5B", color: "#0B4F3B" }}
            >
              <strong>Signed in.</strong>{" "}
              {imported === null || !trip
                ? "Importing your existing events…"
                : `${imported} existing event${imported === 1 ? "" : "s"} imported for ${fmtRange(trip.startDate, trip.endDate)}. They appear as a gray layer next to your plan.`}
            </div>
          )}
        </section>

        <section className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Past vacation photos</h2>
            <span className="chip muted" style={{ border: "1px solid var(--border)" }}>Optional</span>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            Pick photos in Google Photos so the plan can learn what you liked before. Only place labels are kept, not the photos.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button type="button" className="btn" disabled aria-disabled="true" style={{ opacity: 0.5, cursor: "not-allowed" }}>
              Choose photos
            </button>
            <span className="muted">Coming soon</span>
          </div>
        </section>

        <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn" href="/trips/new">Back</Link>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <Link className="btn btn-primary" href={`/trips/${id}/draft`}>Generate plan</Link>
            {signed === false && <span className="muted" style={{ fontSize: 13 }}>Sign in to sync your calendar</span>}
          </div>
        </footer>
      </main>
    </>
  );
}
