// OWNED BY SLICE S2. Read the Google access token from the Auth.js JWT on the server.
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";

export async function getAccessToken(): Promise<string | null> {
  const h = await headers();
  const req = { headers: h } as unknown as Request;
  const secureCookie = (h.get("x-forwarded-proto") ?? "").startsWith("https");
  const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  const t = token?.accessToken;
  return typeof t === "string" ? t : null;
}

export const CAL = "https://www.googleapis.com/calendar/v3";

export async function gfetch<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(CAL + path, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json() as Promise<T>;
}

/** Offset like "+01:00" for a zone at a given instant. */
export function zoneOffset(timeZone: string, at: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" }).formatToParts(at);
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = name.match(/GMT([+-]\d{2}):?(\d{2})?/);
  return m ? `${m[1]}:${m[2] ?? "00"}` : "Z";
}

/** An RFC3339 instant expressed as local wall-clock "YYYY-MM-DDTHH:mm" in tz. */
export function toLocal(dateTime: string, tz: string): string {
  const d = new Date(dateTime);
  if (isNaN(d.getTime())) return dateTime.slice(0, 16);
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(d).map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
