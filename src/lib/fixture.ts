// SHARED. The Lisbon sample trip from the design. Every page falls back to it.
import type { Block, Option, Trip } from "./types";
import { dayColor } from "./colors";

const b = (
  id: string, dayIndex: number, date: string, s: string, e: string, title: string,
  kind: Block["kind"], estCost: number, name: string, lat: number, lng: number,
): Block => ({
  id, dayIndex, start: `${date}T${s}`, end: `${date}T${e}`, title, kind, estCost, locked: false,
  place: { name, address: `${name}, Lisbon, Portugal`, lat, lng },
});

const D1 = "2027-03-14", D2 = "2027-03-15", D3 = "2027-03-16";

export const HOTEL = { name: "Hotel in Baixa", address: "Rua Augusta 100, Lisbon, Portugal", lat: 38.7110, lng: -9.1390 };

export const FIXTURE_TRIP: Trip = {
  id: "fixture-lisbon",
  city: "Lisbon",
  startDate: D1,
  endDate: D3,
  budget: 600,
  accommodation: { kind: "address", address: HOTEL.address, place: HOTEL },
  priorities: "Pastelarias, sunset viewpoints, one live fado night. Not too much walking after lunch.",
  status: "accepted",
  createdAt: "2026-11-13T12:00:00Z",
  days: [D1, D2, D3].map((date, index) => ({ index, date, color: dayColor(index), status: "ready" as const })),
  existingEvents: [
    { id: "ext1", title: "Check-in call", start: `${D1}T08:00`, end: `${D1}T09:00` },
    { id: "ext2", title: "Work call", start: `${D2}T16:45`, end: `${D2}T17:30` },
  ],
  blocks: [
    b("1a", 0, D1, "09:30", "10:30", "Coffee and pastry in Baixa", "meal", 8, "Confeitaria Nacional", 38.7136, -9.1376),
    b("1b", 0, D1, "10:45", "13:00", "Alfama and Castelo de São Jorge", "sight", 15, "Castelo de São Jorge", 38.7139, -9.1335),
    b("1c", 0, D1, "13:15", "14:30", "Lunch", "meal", 24, "Lunch in Alfama", 38.7115, -9.1300),
    b("1d", 0, D1, "15:00", "17:30", "Sé and miradouros", "sight", 0, "Sé de Lisboa", 38.7098, -9.1336),
    b("1e", 0, D1, "19:30", "21:30", "Dinner and fado in Alfama", "meal", 85, "Fado in Alfama", 38.7110, -9.1290),
    b("2a", 1, D2, "09:00", "10:00", "Breakfast", "meal", 10, "Breakfast in Baixa", 38.7105, -9.1395),
    b("2b", 1, D2, "10:30", "13:00", "Belém: Jerónimos and the tower", "sight", 22, "Mosteiro dos Jerónimos", 38.6979, -9.2068),
    b("2c", 1, D2, "13:15", "14:30", "Lunch", "meal", 24, "Lunch in Belém", 38.6975, -9.2030),
    b("2d", 1, D2, "15:00", "17:30", "LX Factory", "sight", 0, "LX Factory", 38.7036, -9.1784),
    b("2e", 1, D2, "19:30", "21:00", "Dinner", "meal", 70, "Dinner in Chiado", 38.7105, -9.1440),
    b("3a", 2, D3, "09:30", "10:30", "Breakfast", "meal", 9, "Breakfast in Baixa", 38.7120, -9.1380),
    b("3b", 2, D3, "11:00", "13:00", "Tram 28 and Graça", "sight", 6, "Graça", 38.7163, -9.1310),
    b("3c", 2, D3, "13:15", "14:30", "Lunch", "meal", 24, "Lunch in Graça", 38.7170, -9.1305),
    b("3d", 2, D3, "16:30", "18:30", "Miradouro da Senhora do Monte", "sight", 0, "Miradouro da Senhora do Monte", 38.7190, -9.1328),
    b("3e", 2, D3, "19:30", "21:30", "Farewell dinner", "meal", 90, "Dinner in Chiado", 38.7108, -9.1420),
  ],
};
FIXTURE_TRIP.blocks[8].warning = "Overlaps Work call";

const opt = (id: string, title: string, rating: number, priceLevel: string, estCost: number, extraMinutes: number, extraKm: number, indoor: boolean, forecast: string, conflict?: string): Option => ({
  id, title, reason: "Fits your priorities and the time of this Block.", estCost, indoor, forecast, conflict,
  extraMinutes, extraKm, openAtTime: true,
  place: { name: title, address: `${title}, Lisbon, Portugal`, rating, priceLevel },
  sourceUrl: "https://www.google.com/maps/search/" + encodeURIComponent(title + " Lisbon"),
});

export const FIXTURE_OPTIONS: Record<"meal" | "sight", Option[]> = {
  meal: [
    opt("m1", "Time Out Market Lisboa", 4.4, "$$", 20, 4, 0.3, true, "17°C, clear"),
    opt("m2", "Cervejaria Ramiro", 4.5, "$$$", 52, 11, 2.1, true, "17°C, clear", "Runs 10 min into the next Block"),
    opt("m3", "A Cevicheria", 4.6, "$$", 38, 7, 1.2, true, "17°C, clear"),
  ],
  sight: [
    opt("s1", "Museu Nacional do Azulejo", 4.5, "$", 10, 12, 4.0, true, "Dry all day"),
    opt("s2", "Miradouro de Santa Luzia", 4.6, "Free", 0, 3, 0.2, false, "Light rain after 16:00"),
    opt("s3", "Panteão Nacional", 4.5, "$", 8, 6, 0.9, true, "Dry all day"),
  ],
};

export const fixtureOptionsFor = (kind: Block["kind"]) => FIXTURE_OPTIONS[kind === "meal" ? "meal" : "sight"];

export const FIXTURE_ANSWER =
  "Go at the start of the Block. Queues build later in the morning, and the walk between stops is easier in cooler hours.";
