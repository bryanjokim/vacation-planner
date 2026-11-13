"use client";
import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { Trip } from "@/lib/types";
import { hotelOf, loopPath, stopsFor } from "./routeData";

// The google.maps namespace is loaded at runtime by APIProvider. Its type package does not
// resolve in every checkout, so read it untyped from the global object.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GMaps = any;
function gmaps(): GMaps | null {
  const g = (globalThis as { google?: { maps?: GMaps } }).google;
  return g?.maps ?? null;
}

export function MapLayers({ trip, dayIndex }: { trip: Trip; dayIndex: number }) {
  const map = useMap();

  // One polyline per Day: a loop from the hotel through the Day's stops.
  useEffect(() => {
    if (!map || !gmaps()) return;
    const hotel = hotelOf(trip);
    const lines = trip.days.map((day) => {
      const selected = day.index === dayIndex;
      return new (gmaps()!).Polyline({
        map,
        path: loopPath(hotel, stopsFor(trip, day.index)),
        strokeColor: day.color,
        strokeOpacity: selected ? 1 : 0.3,
        strokeWeight: selected ? 5 : 3,
        zIndex: selected ? 2 : 1,
      });
    });
    return () => lines.forEach((l) => l.setMap(null));
  }, [map, trip, dayIndex]);

  // Hotel marker and numbered stop markers for the selected Day.
  useEffect(() => {
    if (!map || !gmaps()) return;
    const hotel = hotelOf(trip);
    const stops = stopsFor(trip, dayIndex);
    const color = trip.days.find((d) => d.index === dayIndex)?.color ?? "#333";
    const markers: { setMap(m: null): void }[] = [];
    if (hotel) {
      markers.push(new (gmaps()!).Marker({
        map, position: hotel, title: trip.accommodation.place?.name ?? "Hotel", zIndex: 10,
        label: { text: "H", color: "#fff", fontWeight: "700", fontSize: "12px" },
        icon: { path: gmaps()!.SymbolPath.CIRCLE, scale: 11, fillColor: "#111", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      }));
    }
    stops.forEach((s, i) => {
      markers.push(new (gmaps()!).Marker({
        map, position: { lat: s.lat, lng: s.lng }, title: s.block.title, zIndex: 5,
        label: { text: String(i + 1), color: "#fff", fontWeight: "700", fontSize: "11px" },
        icon: { path: gmaps()!.SymbolPath.CIRCLE, scale: 9, fillColor: color, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      }));
    });
    return () => markers.forEach((m) => m.setMap(null));
  }, [map, trip, dayIndex]);

  // Fit bounds to the selected Day's places plus the hotel.
  useEffect(() => {
    if (!map || !gmaps()) return;
    const pts = loopPath(hotelOf(trip), stopsFor(trip, dayIndex));
    if (!pts.length) return;
    if (pts.length === 1) { map.setCenter(pts[0]); map.setZoom(15); return; }
    const bounds = new (gmaps()!).LatLngBounds();
    pts.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 32);
  }, [map, trip, dayIndex]);

  return null;
}
