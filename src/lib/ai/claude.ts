// OWNED BY SLICE S3. Claude implementation of the PlannerProvider.
import Anthropic from "@anthropic-ai/sdk";
import type { PlannerProvider } from "./provider";
import type { Block, BlockKind, Option, Place, PlanOutline, Trip } from "../types";

const MODEL = "claude-opus-5-5";
let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ timeout: 110_000, maxRetries: 0 }));

const webSearch = (maxUses: number) => ({ type: "web_search_20250305" as const, name: "web_search" as const, max_uses: maxUses });

type Effort = "low" | "medium" | "high";

async function callText(system: string, prompt: string, opts: { searches?: number; effort?: Effort; maxTokens?: number }): Promise<string> {
  const params: Record<string, unknown> = {
    model: MODEL,
    max_tokens: opts.maxTokens ?? 4000,
    system,
    messages: [{ role: "user", content: prompt }],
  };
  if (opts.searches) params.tools = [webSearch(opts.searches)];
  if (opts.effort) params.output_config = { effort: opts.effort };
  const res = await getClient().messages.create(params as unknown as Anthropic.MessageCreateParamsNonStreaming);
  return res.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("");
}

/** Extract the last balanced JSON object or array from text. */
export function extractJson(text: string): unknown {
  const fenced = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((m) => m[1]);
  for (const f of fenced.reverse()) {
    try {
      return JSON.parse(f);
    } catch {}
  }
  for (let end = text.length - 1; end >= 0; end--) {
    const ch = text[end];
    if (ch !== "}" && ch !== "]") continue;
    const open = ch === "}" ? "{" : "[";
    let depth = 0;
    let inStr = false;
    for (let i = end; i >= 0; i--) {
      const c = text[i];
      if (c === '"' && text[i - 1] !== "\\") inStr = !inStr;
      if (inStr) continue;
      if (c === ch) depth++;
      else if (c === open) {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(text.slice(i, end + 1));
          } catch {
            break;
          }
        }
      }
    }
  }
  throw new Error("No JSON found in Claude response");
}

const num = (v: unknown, d = 0) => (typeof v === "number" && isFinite(v) ? v : typeof v === "string" && isFinite(+v) ? +v : d);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

function toPlace(p: unknown): Place | undefined {
  if (!p || typeof p !== "object") return undefined;
  const o = p as Record<string, unknown>;
  const name = str(o.name);
  if (!name) return undefined;
  return {
    name,
    address: str(o.address) ?? "",
    lat: typeof o.lat === "number" ? o.lat : undefined,
    lng: typeof o.lng === "number" ? o.lng : undefined,
    rating: typeof o.rating === "number" ? o.rating : undefined,
    priceLevel: str(o.priceLevel),
    website: str(o.website),
  };
}

const KINDS: BlockKind[] = ["meal", "sight", "event", "other"];
const rand = () => Math.random().toString(36).slice(2, 8);
const hhmm = (s: string) => s.slice(11, 16);
const overlaps = (aS: string, aE: string, bS: string, bE: string) => aS < bE && bS < aE;

function tripContext(trip: Trip): string {
  const hotel = trip.accommodation.place
    ? `${trip.accommodation.place.name}, ${trip.accommodation.place.address}`
    : trip.accommodation.address ?? "not chosen yet";
  return [
    `City: ${trip.city}`,
    `Dates: ${trip.startDate} to ${trip.endDate}`,
    `Total budget: ${trip.budget} USD`,
    `Accommodation: ${hotel}`,
    `Priorities: ${trip.priorities || "none given"}`,
    trip.tasteSummary ? `Taste summary: ${trip.tasteSummary}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const SYSTEM =
  "You are an expert travel planner. Use real, currently operating places with accurate addresses and coordinates. " +
  "When asked for JSON, end your reply with a single ```json fenced block and nothing after it.";

export const claudeProvider: PlannerProvider = {
  async outline(trip) {
    const suggest = trip.accommodation.kind === "suggest";
    const prompt = `${tripContext(trip)}
Days: ${trip.days.map((d) => `${d.index}=${d.date}`).join(", ")}

Plan an outline: for each Day a neighborhood, a short theme, and 2 to 4 must-do items (specific named places). Never repeat a place across Days. Group each Day geographically.
${suggest ? "Also suggest one well-located hotel matching the budget as suggestedAccommodation {name, address, lat, lng}." : ""}
Return JSON: {"days":[{"dayIndex":0,"neighborhood":"...","theme":"...","mustDo":["..."]}]${suggest ? ',"suggestedAccommodation":{"name":"...","address":"...","lat":0,"lng":0}' : ""}}`;
    const text = await callText(SYSTEM, prompt, { effort: "low", maxTokens: 3000 });
    const json = extractJson(text) as { days?: unknown[]; suggestedAccommodation?: unknown };
    if (!Array.isArray(json.days)) throw new Error("Outline missing days");
    const seen = new Set<string>();
    const out: PlanOutline = {
      days: trip.days.map((d) => {
        const raw = (json.days!.find((x) => num((x as Record<string, unknown>).dayIndex, -1) === d.index) ??
          json.days![d.index] ??
          {}) as Record<string, unknown>;
        const mustDo = (Array.isArray(raw.mustDo) ? raw.mustDo : [])
          .map((m) => String(m).trim())
          .filter((m) => m && !seen.has(m.toLowerCase()) && (seen.add(m.toLowerCase()), true))
          .slice(0, 4);
        return { dayIndex: d.index, date: d.date, neighborhood: str(raw.neighborhood) ?? "", theme: str(raw.theme) ?? "", mustDo };
      }),
    };
    if (suggest) {
      const p = toPlace(json.suggestedAccommodation);
      if (p) out.suggestedAccommodation = p;
    }
    return out;
  },

  async planDay(trip, outline, dayIndex) {
    const day = trip.days.find((d) => d.index === dayIndex);
    if (!day) throw new Error(`No Day ${dayIndex}`);
    const od = outline.days.find((d) => d.dayIndex === dayIndex);
    const otherMustDo = outline.days.filter((d) => d.dayIndex !== dayIndex).flatMap((d) => d.mustDo);
    const locked = trip.blocks.filter((b) => b.dayIndex === dayIndex && b.locked);
    const events = trip.existingEvents.filter((e) => e.start.slice(0, 10) === day.date || e.end.slice(0, 10) === day.date);
    const busy = [
      ...locked.map((b) => ({ s: b.start, e: b.end, label: `${b.title} (locked)` })),
      ...events.map((e) => ({ s: e.start, e: e.end, label: e.title })),
    ];
    const prompt = `${tripContext(trip)}

Plan Day ${dayIndex} on ${day.date}. Neighborhood: ${od?.neighborhood || "any"}. Theme: ${od?.theme || "any"}.
Must include: ${od?.mustDo.join("; ") || "your best picks"}.
Do not use these places (other Days): ${otherMustDo.join("; ") || "none"}.
Busy times you must NOT overlap (keep free): ${busy.map((b) => `${hhmm(b.s)}-${hhmm(b.e)} ${b.label}`).join("; ") || "none"}.

Make about 5 blocks between 09:00 and 21:30: breakfast, morning sight, lunch, afternoon activity, dinner. Skip a slot if it collides with a busy time. Use web search (briefly) to verify places are open and get addresses/coordinates.
Return JSON: {"blocks":[{"start":"HH:mm","end":"HH:mm","title":"...","kind":"meal|sight|event|other","place":{"name":"...","address":"...","lat":0,"lng":0},"estCost":0,"sourceUrl":"https://..."}]}
estCost is USD per person.`;
    const text = await callText(SYSTEM, prompt, { searches: 3, effort: "low", maxTokens: 6000 });
    const json = extractJson(text) as { blocks?: unknown[] } | unknown[];
    const raw = (Array.isArray(json) ? json : json.blocks) ?? [];
    if (!Array.isArray(raw) || raw.length === 0) throw new Error("planDay returned no blocks");
    const fixTime = (t: unknown) => {
      const s = String(t ?? "");
      const m = s.match(/(\d{1,2}):(\d{2})/);
      if (!m) return undefined;
      return `${day.date}T${m[1].padStart(2, "0")}:${m[2]}`;
    };
    const blocks: Block[] = [];
    raw.forEach((r, n) => {
      const o = r as Record<string, unknown>;
      const start = fixTime(o.start);
      const end = fixTime(o.end);
      const title = str(o.title);
      if (!start || !end || !title || end <= start) return;
      if (busy.some((b) => overlaps(start, end, b.s, b.e))) return;
      if (blocks.some((b) => overlaps(start, end, b.start, b.end))) return;
      blocks.push({
        id: `${dayIndex}-${n}-${rand()}`,
        dayIndex,
        start,
        end,
        title,
        kind: KINDS.includes(o.kind as BlockKind) ? (o.kind as BlockKind) : "other",
        place: toPlace(o.place),
        estCost: num(o.estCost),
        locked: false,
        sourceUrl: str(o.sourceUrl),
      });
    });
    if (blocks.length === 0) throw new Error("planDay produced no usable blocks");
    return [...locked, ...blocks].sort((a, b) => a.start.localeCompare(b.start));
  },

  async *ask(trip, blockId, question) {
    const block = trip.blocks.find((b) => b.id === blockId);
    if (!block) throw new Error(`No Block ${blockId}`);
    const prompt = `Trip city: ${trip.city}. Block: "${block.title}" at ${block.place?.name ?? "unknown place"}${block.place?.address ? `, ${block.place.address}` : ""}, ${block.start} to ${block.end}.
Question: ${question}
Answer in under 120 words, plain text, no headings. Search only if needed.`;
    const stream = getClient().messages.stream({
      model: MODEL,
      max_tokens: 1200,
      system: "You are a concise travel assistant. You never change the itinerary; you only answer.",
      messages: [{ role: "user", content: prompt }],
      tools: [webSearch(2)],
      output_config: { effort: "low" },
    } as unknown as Anthropic.MessageStreamParams);
    for await (const ev of stream) {
      if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") yield ev.delta.text;
    }
  },

  async findOptions(trip, blockId) {
    const block = trip.blocks.find((b) => b.id === blockId);
    if (!block) throw new Error(`No Block ${blockId}`);
    const neighbors = trip.blocks
      .filter((b) => b.dayIndex === block.dayIndex && b.id !== block.id)
      .sort((a, b) => a.start.localeCompare(b.start));
    const prompt = `${tripContext(trip)}

Current block (Day ${block.dayIndex}): "${block.title}" (${block.kind}) at ${block.place?.name ?? "?"}, ${block.start} to ${block.end}, est ${block.estCost} USD.
Other blocks that day: ${neighbors.map((b) => `${hhmm(b.start)}-${hhmm(b.end)} ${b.title}`).join("; ") || "none"}.

Suggest 3 to 5 real alternative ${block.kind === "meal" ? "places to eat" : "activities"} for this time slot, nearby. Use web search briefly.
Return JSON: {"options":[{"title":"...","place":{"name":"...","address":"...","lat":0,"lng":0,"rating":4.5,"priceLevel":"$$"},"reason":"one line","estCost":0,"indoor":true,"durationMinutes":90,"sourceUrl":"https://...","bookingUrl":"https://..."}]}`;
    const text = await callText(SYSTEM, prompt, { searches: 3, effort: "low", maxTokens: 5000 });
    const json = extractJson(text) as { options?: unknown[] } | unknown[];
    const raw = (Array.isArray(json) ? json : json.options) ?? [];
    const options: Option[] = [];
    for (const r of raw.slice(0, 5)) {
      const o = r as Record<string, unknown>;
      const place = toPlace(o.place);
      const title = str(o.title) ?? place?.name;
      if (!place || !title) continue;
      const dur = num(o.durationMinutes, 0);
      let conflict: string | undefined;
      if (dur > 0) {
        const startMs = Date.parse(block.start + ":00Z");
        const endIso = new Date(startMs + dur * 60_000).toISOString().slice(0, 16);
        const hit = neighbors.find((n) => overlaps(block.start, endIso, n.start, n.end));
        if (hit) conflict = `Overlaps ${hit.title}`;
      }
      options.push({
        id: `opt-${rand()}`,
        title,
        place,
        reason: str(o.reason) ?? "",
        estCost: num(o.estCost),
        indoor: o.indoor === true,
        sourceUrl: str(o.sourceUrl),
        bookingUrl: str(o.bookingUrl),
        conflict,
      });
    }
    if (options.length < 1) throw new Error("findOptions returned no options");
    return options;
  },
};
