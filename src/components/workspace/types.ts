// SHARED CONTRACT for the workspace components. Slice agents must not change this file.
import type { Block, Option, Trip } from "@/lib/types";

export interface CalendarProps {
  trip: Trip;
  dayIndex: number;
  onDayChange: (dayIndex: number) => void;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  /** Called after a drag, resize, or edit. The page marks the Block locked and saves. */
  onBlockChange: (block: Block) => void;
}

export interface RouteMapProps {
  trip: Trip;
  dayIndex: number;
}

export interface BlockPanelProps {
  trip: Trip;
  block: Block | null;
  /** S7 calls this with the options it found, so OptionCards can render them under the calendar. */
  onOptions: (options: Option[] | null) => void;
}

export interface OptionCardsProps {
  trip: Trip;
  block: Block;
  options: Option[];
  /** Replace the Block's place, title, and cost with this option. */
  onUse: (option: Option) => void;
}
