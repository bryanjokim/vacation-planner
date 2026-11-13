// OWNED BY SLICE S3.
import { provider } from "@/lib/ai";
import type { DayRequest } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { trip, outline, dayIndex } = (await req.json()) as DayRequest;
  return Response.json({ blocks: await provider.planDay(trip, outline, dayIndex) });
}
