// OWNED BY SLICE S2. Connect Google (artboard 3). "Generate plan" goes to /trips/[id]/draft.
"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";

export default function Connect() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <Header />
      <main className="page page-narrow">
        <h1>Connect your Google Calendar</h1>
        <Link className="btn btn-primary" href={`/trips/${id}/draft`}>Generate plan</Link>
      </main>
    </>
  );
}
