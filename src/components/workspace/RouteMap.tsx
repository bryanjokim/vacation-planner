"use client";
// OWNED BY SLICE S6. Google map with one colored route per Day from the hotel (artboard 5, top right).
import { useState } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import type { RouteMapProps } from "./types";
import { MapLayers } from "./map/MapLayers";
import { hotelOf, mapsLink, stopsFor } from "./map/routeData";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function RouteMap({ trip, dayIndex }: RouteMapProps) {
  const [failed, setFailed] = useState(false);
  const hotel = hotelOf(trip);
  const stops = stopsFor(trip, dayIndex);
  const link = mapsLink(hotel, stops);
  const hotelName = trip.accommodation.place?.name ?? "Hotel";
  const center = hotel ?? (stops[0] ? { lat: stops[0].lat, lng: stops[0].lng } : { lat: 0, lng: 0 });
  const showMap = Boolean(API_KEY) && !failed && (hotel !== null || stops.length > 0);

  return (
    <section className="card" style={{ padding: 16 }}>
      {showMap ? (
        <div style={{ height: 300, borderRadius: 8, overflow: "hidden" }}>
          <APIProvider apiKey={API_KEY} onError={() => setFailed(true)}>
            <Map
              style={{ width: "100%", height: "100%" }}
              defaultCenter={center}
              defaultZoom={14}
              gestureHandling="cooperative"
              disableDefaultUI
              zoomControl
            >
              <MapLayers trip={trip} dayIndex={dayIndex} />
            </Map>
          </APIProvider>
        </div>
      ) : (
        <div style={{ minHeight: 120 }}>
          <strong>Day {dayIndex + 1} stops</strong>
          <ol style={{ margin: "8px 0 0", paddingLeft: 20 }}>
            {hotel && <li>{hotelName}</li>}
            {stops.map((s) => (
              <li key={s.block.id}>
                {s.block.start.slice(11, 16)} {s.block.title}
                {s.block.place ? ` · ${s.block.place.name}` : ""}
              </li>
            ))}
            {hotel && <li>{hotelName}</li>}
          </ol>
          {stops.length === 0 && <p style={{ margin: "8px 0 0", opacity: 0.7 }}>No mapped stops for this day yet.</p>}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 10, fontSize: 13 }}>
        <span style={{ opacity: 0.75 }}>Each day starts and ends at the hotel.</span>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer">
            Day {dayIndex + 1} in Google Maps
          </a>
        )}
      </div>
    </section>
  );
}
