// SHARED CONTRACT. The swappable AI provider layer. Slice agents must not change this file.
import type { Block, Option, PlanOutline, Trip } from "../types";

export interface PlannerProvider {
  /** Short call, no search: a neighborhood, theme, and must-do items per Day; a hotel if accommodation.kind is "suggest". */
  outline(trip: Trip): Promise<PlanOutline>;
  /** One Day with web search. Must plan around trip.existingEvents and the Day's locked Blocks. */
  planDay(trip: Trip, outline: PlanOutline, dayIndex: number): Promise<Block[]>;
  /** Streamed answer about one Block. Never changes the Block. Up to 2 searches. */
  ask(trip: Trip, blockId: string, question: string): AsyncIterable<string>;
  /** 3 to 5 candidates for one Block. Up to 3 searches. */
  findOptions(trip: Trip, blockId: string): Promise<Option[]>;
}
