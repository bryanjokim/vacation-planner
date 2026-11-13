// SHARED. Day colors from the design, and the nearest Google Calendar colorId for each.
export const DAY_COLORS = ["#1F4FD8", "#C2570C", "#0B7A5B", "#7A3FC4"];
export const GOOGLE_COLOR_IDS = ["9", "6", "10", "3"]; // Blueberry, Tangerine, Basil, Grape

export const dayColor = (dayIndex: number) => DAY_COLORS[dayIndex % DAY_COLORS.length];
export const googleColorId = (dayIndex: number) => GOOGLE_COLOR_IDS[dayIndex % GOOGLE_COLOR_IDS.length];

export const EXISTING_EVENT_COLOR = "#9AA3B2";
