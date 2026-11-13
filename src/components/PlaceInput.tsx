"use client";
// Text input with Google Places (New) autocomplete suggestions. Works as a plain input if Maps fails to load.
import { useEffect, useId, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import type { Place } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface Suggestion { id: string; main: string; secondary: string; prediction: Any }

export interface PlaceInputProps {
  id: string;
  value: string;
  onChange: (text: string) => void;
  /** Called with the full place when the user picks a suggestion. */
  onSelect: (place: Place) => void;
  /** "(cities)" for the city field; omit for addresses and hotels. */
  types?: string[];
  /** Bias suggestions near this point (for example the chosen city). */
  near?: { lat: number; lng: number };
  placeholder?: string;
  required?: boolean;
}

export function PlaceInput({ id, value, onChange, onSelect, types, near, placeholder, required }: PlaceInputProps) {
  const places = useMapsLibrary("places") as Any;
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const token = useRef<Any>(null);
  const skip = useRef(false);
  const listId = useId();

  useEffect(() => {
    if (!places || skip.current) { skip.current = false; return; }
    const q = value.trim();
    if (q.length < 2) { setItems([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        if (!token.current) token.current = new places.AutocompleteSessionToken();
        const req: Any = { input: q, sessionToken: token.current };
        if (types) req.includedPrimaryTypes = types;
        if (near) req.locationBias = { center: near, radius: 30000 };
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
        if (cancelled) return;
        setItems(
          (suggestions as Any[]).filter((s) => s.placePrediction).slice(0, 5).map((s) => ({
            id: s.placePrediction.placeId,
            main: s.placePrediction.mainText?.text ?? s.placePrediction.text?.text ?? "",
            secondary: s.placePrediction.secondaryText?.text ?? "",
            prediction: s.placePrediction,
          })),
        );
        setOpen(true);
        setActive(-1);
      } catch (e) {
        console.warn("autocomplete failed", e);
        setItems([]);
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [places, value, types, near]);

  const choose = async (s: Suggestion) => {
    setOpen(false);
    setItems([]);
    skip.current = true;
    onChange(s.secondary ? `${s.main}, ${s.secondary}` : s.main);
    try {
      const place = s.prediction.toPlace();
      await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
      token.current = null;
      onSelect({
        name: place.displayName ?? s.main,
        address: place.formattedAddress ?? s.main,
        placeId: s.id,
        lat: place.location?.lat(),
        lng: place.location?.lng(),
      });
    } catch (e) {
      console.warn("place details failed", e);
      onSelect({ name: s.main, address: s.secondary ? `${s.main}, ${s.secondary}` : s.main, placeId: s.id });
    }
  };

  const showList = open && items.length > 0;

  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        className="input"
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
          else if (e.key === "Enter" && active >= 0) { e.preventDefault(); void choose(items[active]); }
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          style={{ position: "absolute", zIndex: 20, left: 0, right: 0, top: "calc(100% + 4px)", margin: 0, padding: 4, listStyle: "none", background: "#FFFFFF", border: "1px solid var(--input-border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(20,24,31,0.12)" }}
        >
          {items.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); void choose(s); }}
              onMouseEnter={() => setActive(i)}
              style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: i === active ? "var(--primary-soft)" : "transparent", minHeight: 44, display: "flex", flexDirection: "column", justifyContent: "center" }}
            >
              <span style={{ fontSize: 15, fontWeight: 500 }}>{s.main}</span>
              {s.secondary && <span style={{ fontSize: 13, color: "var(--muted)" }}>{s.secondary}</span>}
            </li>
          ))}
          <li aria-hidden="true" style={{ padding: "4px 12px", fontSize: 11, color: "var(--muted)", textAlign: "right" }}>Powered by Google</li>
        </ul>
      )}
    </div>
  );
}
