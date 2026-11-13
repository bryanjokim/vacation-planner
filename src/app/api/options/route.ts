// OWNED BY SLICE S7.
import { provider } from "@/lib/ai";
import type { OptionsRequest } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { trip, blockId } = (await req.json()) as OptionsRequest;
  return Response.json({ options: await provider.findOptions(trip, blockId) });
}
