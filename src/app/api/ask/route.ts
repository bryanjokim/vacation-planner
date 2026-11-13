// OWNED BY SLICE S7.
import { provider } from "@/lib/ai";
import type { AskRequest } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { trip, blockId, question } = (await req.json()) as AskRequest;
    const it = provider.ask(trip, blockId, question)[Symbol.asyncIterator]();
    // Read the first chunk before streaming so a provider failure becomes a 500 and the client falls back.
    const first = await it.next();
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!first.done && first.value) controller.enqueue(enc.encode(first.value));
          if (!first.done) {
            for (;;) {
              const r = await it.next();
              if (r.done) break;
              if (r.value) controller.enqueue(enc.encode(r.value));
            }
          }
        } catch (e) {
          console.error("ask stream error", e);
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8" } });
  } catch (e) {
    console.error("ask error", e);
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
