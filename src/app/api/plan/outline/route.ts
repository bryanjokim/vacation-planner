// OWNED BY SLICE S3.
import { provider } from "@/lib/ai";
import type { OutlineRequest } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { trip } = (await req.json()) as OutlineRequest;
  return Response.json(await provider.outline(trip));
}
