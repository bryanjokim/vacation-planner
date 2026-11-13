import type { Block, Trip } from "@/lib/types";

export interface LatLng { lat: number; lng: number }
export interface Stop extends LatLng { block: Block }

export function hotelOf(trip: Trip): LatLng | null {
  const p = trip.accommodation.place;
  return p && typeof p.lat === "number" && typeof p.lng === "number" ? { lat: p.lat, lng: p.lng } : null;
}

export function stopsFor(trip: Trip, dayIndex: number): Stop[] {
  return trip.blocks
    .filter((b) => b.dayIndex === dayIndex && typeof b.place?.lat === "number" && typeof b.place?.lng === "number")
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((b) => ({ lat: b.place!.lat!, lng: b.place!.lng!, block: b }));
}

export function loopPath(hotel: LatLng | null, stops: LatLng[]): LatLng[] {
  const pts = stops.map(({ lat, lng }) => ({ lat, lng }));
  return hotel ? [hotel, ...pts, hotel] : pts;
}

export function mapsLink(hotel: LatLng | null, stops: LatLng[]): string | null {
  const pts = loopPath(hotel, stops);
  if (pts.length < 2) return null;
  const s = (p: LatLng) => `${p.lat},${p.lng}`;
  const params = new URLSearchParams({
    api: "1",
    origin: s(pts[0]),
    destination: s(pts[pts.length - 1]),
    travelmode: "walking",
  });
  const mid = pts.slice(1, -1);
  if (mid.length) params.set("waypoints", mid.map(s).join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
