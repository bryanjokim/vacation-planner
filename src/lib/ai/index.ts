// SHARED. Pick the provider here. Swapping models touches only src/lib/ai/.
import type { PlannerProvider } from "./provider";
import { claudeProvider } from "./claude";

export const provider: PlannerProvider = claudeProvider;
