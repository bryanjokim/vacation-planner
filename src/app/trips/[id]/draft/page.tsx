// OWNED BY SLICE S4. Draft plan (artboard 4). Runs outline + parallel Day calls, then "Accept draft".
"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";

export default function Draft() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <Header />
      <main className="page">
        <h1>Draft plan</h1>
        <Link className="btn btn-primary" href={`/trips/${id}`}>Accept draft</Link>
      </main>
    </>
  );
}
