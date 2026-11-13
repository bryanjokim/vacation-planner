"use client";
// OWNED BY SLICE S6. Google map with one colored route per Day from the hotel (artboard 5, top right).
import type { RouteMapProps } from "./types";

export function RouteMap({ trip, dayIndex }: RouteMapProps) {
  return <section className="card" style={{ padding: 16, minHeight: 300 }}>Map for Day {dayIndex + 1} of {trip.city}</section>;
}
