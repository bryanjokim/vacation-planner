// SHARED CONTRACT. Owned by the skeleton. Slice agents must not change this file.
// Times are local wall-clock strings without a time zone: "2027-03-14T09:30".

export type LocalDate = string; // "2027-03-14"
export type LocalDateTime = string; // "2027-03-14T09:30"

export interface Place {
  name: string;
  address: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  priceLevel?: string; // "Free" | "$" | "$$" | "$$$" | "$$$$"
  website?: string;
}

export interface Accommodation {
  kind: "address" | "suggest";
  address?: string; // when kind is "address"
  place?: Place; // resolved hotel (known address, or the AI suggestion)
}

export type BlockKind = "meal" | "sight" | "event" | "other";

export interface Block {
  id: string;
  dayIndex: number; // 0-based
  start: LocalDateTime;
  end: LocalDateTime;
  title: string;
  kind: BlockKind;
  place?: Place;
  estCost: number; // USD, AI estimate
  locked: boolean; // true after the user moved, resized, or edited it
  warning?: string; // e.g. "Closed at this time" or "Overlaps Work call"
  sourceUrl?: string;
  googleEventId?: string;
}

export type DayStatus = "pending" | "loading" | "ready" | "failed";

export interface Day {
  index: number; // 0-based
  date: LocalDate;
  color: string; // from DAY_COLORS
  neighborhood?: string;
  theme?: string;
  status: DayStatus;
}

export interface ExistingEvent {
  id: string;
  title: string;
  start: LocalDateTime;
  end: LocalDateTime;
}

export type TripStatus = "planning" | "draft" | "accepted";

export interface Trip {
  id: string;
  city: string;
  startDate: LocalDate;
  endDate: LocalDate;
  budget: number; // USD
  accommodation: Accommodation;
  priorities: string;
  tasteSummary?: string; // ticket 08, appended to priorities for Generate plan
  status: TripStatus;
  days: Day[];
  blocks: Block[];
  existingEvents: ExistingEvent[];
  googleCalendarId?: string;
  createdAt: string; // ISO timestamp
}

export interface DayOutline {
  dayIndex: number;
  date: LocalDate;
  neighborhood: string;
  theme: string;
  mustDo: string[];
}

export interface PlanOutline {
  days: DayOutline[];
  suggestedAccommodation?: Place; // only when trip.accommodation.kind is "suggest"
}

export interface Option {
  id: string;
  place: Place;
  title: string;
  reason: string;
  estCost: number;
  indoor: boolean;
  sourceUrl?: string;
  bookingUrl?: string;
  extraMinutes?: number;
  extraKm?: number;
  openAtTime?: boolean;
  forecast?: string;
  conflict?: string; // undefined means "No conflicts"
}

// ---- API request and response bodies ----

export interface OutlineRequest { trip: Trip }
export type OutlineResponse = PlanOutline;

export interface DayRequest { trip: Trip; outline: PlanOutline; dayIndex: number }
export interface DayResponse { blocks: Block[] }

export interface AskRequest { trip: Trip; blockId: string; question: string }
// AskResponse: a text/plain stream.

export interface OptionsRequest { trip: Trip; blockId: string }
export interface OptionsResponse { options: Option[] }

export interface EventsResponse { events: ExistingEvent[] } // GET /api/calendar/events?start=&end=

export interface SyncRequest { trip: Trip }
export interface SyncResponse { calendarId: string; eventIds: Record<string, string> } // blockId -> Google event id
