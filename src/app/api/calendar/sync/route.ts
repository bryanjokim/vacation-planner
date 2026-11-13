// OWNED BY SLICE S2. Create the "Trip: <city>" calendar if needed, then insert or patch one event per block.
import { auth } from "@/auth";
import { getAccessToken, gfetch } from "@/lib/google/token";
import { googleColorId } from "@/lib/colors";
import type { SyncRequest, SyncResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  const token = session ? await getAccessToken() : null;
  if (!session || !token) return Response.json({ error: "not signed in" }, { status: 401 });

  let body: SyncRequest;
  try { body = (await req.json()) as SyncRequest; } catch { return Response.json({ error: "bad json" }, { status: 400 }); }
  const trip = body?.trip;
  if (!trip || !Array.isArray(trip.blocks)) return Response.json({ error: "trip is required" }, { status: 400 });

  try {
    const primary = await gfetch<{ timeZone?: string }>(token, "/calendars/primary");
    const timeZone = primary.timeZone ?? "UTC";

    let calendarId = trip.googleCalendarId;
    if (!calendarId) {
      const cal = await gfetch<{ id: string }>(token, "/calendars", {
        method: "POST",
        body: JSON.stringify({ summary: `Trip: ${trip.city}`, timeZone }),
      });
      calendarId = cal.id;
    }
    const calPath = `/calendars/${encodeURIComponent(calendarId)}/events`;

    const eventIds: Record<string, string> = {};
    for (const block of trip.blocks) {
      const ev = {
        summary: block.title,
        location: block.place?.address ?? "",
        start: { dateTime: block.start.slice(0, 16) + ":00", timeZone },
        end: { dateTime: block.end.slice(0, 16) + ":00", timeZone },
        colorId: googleColorId(block.dayIndex),
      };
      let saved: { id: string } | null = null;
      if (block.googleEventId) {
        try {
          saved = await gfetch<{ id: string }>(token, `${calPath}/${encodeURIComponent(block.googleEventId)}`, {
            method: "PATCH",
            body: JSON.stringify(ev),
          });
        } catch (e) {
          console.warn("patch failed, inserting instead", e); // e.g. the event was deleted in Google
        }
      }
      if (!saved) saved = await gfetch<{ id: string }>(token, calPath, { method: "POST", body: JSON.stringify(ev) });
      eventIds[block.id] = saved.id;
    }
    return Response.json({ calendarId, eventIds } satisfies SyncResponse);
  } catch (e) {
    console.error("calendar sync", e);
    return Response.json({ error: "google request failed" }, { status: 502 });
  }
}
