// OWNED BY SLICE S7.
import { provider } from "@/lib/ai";
import type { OptionsRequest } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { trip, blockId } = (await req.json()) as OptionsRequest;
    return Response.json({ options: await provider.findOptions(trip, blockId) });
  } catch (e) {
    console.error("options error", e);
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
