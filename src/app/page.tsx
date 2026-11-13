// OWNED BY SLICE S1. Trip manager (artboard 1).
import { Header } from "@/components/Header";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Header />
      <main className="page">
        <h1>Your trips</h1>
        <Link className="btn btn-primary" href="/trips/new">New trip</Link>
        <Link href="/trips/fixture-lisbon">Open the Lisbon sample</Link>
      </main>
    </>
  );
}
