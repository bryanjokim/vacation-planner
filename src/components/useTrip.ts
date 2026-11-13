"use client";
// SHARED. Load a trip by id from storage; "fixture-lisbon" or a missing id falls back to the fixture.
import { useCallback, useEffect, useState } from "react";
import type { Trip } from "@/lib/types";
import { storage } from "@/lib/storage";
import { FIXTURE_TRIP } from "@/lib/fixture";

export function useTrip(id: string) {
  const [trip, setTripState] = useState<Trip | null>(null);
  useEffect(() => {
    setTripState(storage.getTrip(id) ?? (id === FIXTURE_TRIP.id ? FIXTURE_TRIP : null) ?? FIXTURE_TRIP);
  }, [id]);
  const setTrip = useCallback((next: Trip) => {
    storage.saveTrip(next);
    setTripState(next);
  }, []);
  return { trip, setTrip };
}
