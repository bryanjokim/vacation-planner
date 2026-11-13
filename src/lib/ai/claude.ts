// OWNED BY SLICE S3. Stub: returns the fixture until S3 implements the Claude calls.
import type { PlannerProvider } from "./provider";
import { FIXTURE_ANSWER, FIXTURE_TRIP, fixtureOptionsFor } from "../fixture";

export const claudeProvider: PlannerProvider = {
  async outline(trip) {
    return {
      days: trip.days.map((d) => ({ dayIndex: d.index, date: d.date, neighborhood: "", theme: "", mustDo: [] })),
    };
  },
  async planDay(_trip, _outline, dayIndex) {
    return FIXTURE_TRIP.blocks.filter((b) => b.dayIndex === dayIndex % 3);
  },
  async *ask() {
    yield FIXTURE_ANSWER;
  },
  async findOptions(trip, blockId) {
    const block = trip.blocks.find((b) => b.id === blockId);
    return fixtureOptionsFor(block?.kind ?? "sight");
  },
};
