// OWNED BY SLICE S7.
import { provider } from "@/lib/ai";
import type { AskRequest } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { trip, blockId, question } = (await req.json()) as AskRequest;
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of provider.ask(trip, blockId, question)) controller.enqueue(enc.encode(chunk));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
