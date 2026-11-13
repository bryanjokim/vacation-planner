// OWNED BY SLICE S2. List primary-calendar events in a local time range.
import { auth } from "@/auth";
import { getAccessToken, gfetch, toLocal, zoneOffset } from "@/lib/google/token";
import type { ExistingEvent, EventsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

interface GEvent {
  id: string;
  summary?: string;
  status?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

export async function GET(req: Request) {
  const session = await auth();
  const token = session ? await getAccessToken() : null;
  if (!session || !token) return Response.json({ error: "not signed in" }, { status: 401 });

  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  if (!start || !end) return Response.json({ error: "start and end are required" }, { status: 400 });

  try {
    const primary = await gfetch<{ timeZone?: string }>(token, "/calendars/primary");
    const tz = primary.timeZone ?? "UTC";
    const toRfc = (local: string) => {
      const s = local.slice(0, 16) + ":00";
      return s + zoneOffset(tz, new Date(s + "Z"));
    };
    const q = new URLSearchParams({
      timeMin: toRfc(start), timeMax: toRfc(end), singleEvents: "true", orderBy: "startTime", maxResults: "250", timeZone: tz,
    });
    const data = await gfetch<{ items?: GEvent[] }>(token, `/calendars/primary/events?${q}`);
    const events: ExistingEvent[] = (data.items ?? [])
      .filter((e) => e.status !== "cancelled" && e.start?.dateTime && e.end?.dateTime)
      .map((e) => ({
        id: e.id,
        title: e.summary ?? "(busy)",
        start: toLocal(e.start!.dateTime!, tz),
        end: toLocal(e.end!.dateTime!, tz),
      }));
    return Response.json({ events } satisfies EventsResponse);
  } catch (e) {
    console.error("calendar events", e);
    return Response.json({ error: "google request failed" }, { status: 502 });
  }
}
