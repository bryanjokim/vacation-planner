// SHARED. Trips live in localStorage behind this interface (client only).
import type { Trip } from "./types";

const KEY = "vp.trips";

function readAll(): Trip[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]") as Trip[];
  } catch {
    return [];
  }
}

function writeAll(trips: Trip[]) {
  window.localStorage.setItem(KEY, JSON.stringify(trips));
}

export const storage = {
  listTrips(): Trip[] {
    return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  getTrip(id: string): Trip | undefined {
    return readAll().find((t) => t.id === id);
  },
  saveTrip(trip: Trip): void {
    const all = readAll().filter((t) => t.id !== trip.id);
    writeAll([...all, trip]);
  },
  deleteTrip(id: string): void {
    writeAll(readAll().filter((t) => t.id !== id));
  },
};

export const newId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2));
