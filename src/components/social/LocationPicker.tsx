"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps";

export type LocationValue = { address: string; lat: string; lng: string };

const FALLBACK_CENTER = { lat: 14.5995, lng: 120.9842 };

export function LocationPicker({
  apiKey,
  name,
  value,
  placeholder,
  required,
  onChange,
}: {
  apiKey: string;
  name: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  onChange: (value: LocationValue) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [placesReady, setPlacesReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then((api) => {
        const container = mapRef.current;
        const input = inputRef.current;
        if (cancelled || !container || !input) return;

        const { maps } = api;
        const map = new maps.Map(container, {
          center: FALLBACK_CENTER,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        const marker = new maps.Marker({ position: FALLBACK_CENTER, map, draggable: true });
        const geocoder = new maps.Geocoder();

        const apply = (lat: number, lng: number, address: string) => {
          marker.setPosition({ lat, lng });
          if (address) input.value = address;
          onChangeRef.current({ address, lat: lat.toFixed(7), lng: lng.toFixed(7) });
        };

        const reverse = (lat: number, lng: number) => {
          geocoder.geocode({ location: { lat, lng } }, (results, code) => {
            const address =
              code === "OK" && results?.[0]?.formatted_address
                ? results[0].formatted_address
                : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            apply(lat, lng, address);
          });
        };

        marker.addListener("dragend", () => {
          const position = marker.getPosition();
          if (position) reverse(position.lat(), position.lng());
        });

        map.addListener("click", (event) => {
          if (!event?.latLng) return;
          reverse(event.latLng.lat(), event.latLng.lng());
        });

        if (maps.places) {
          try {
            const autocomplete = new maps.places.Autocomplete(input, {
              fields: ["formatted_address", "name", "geometry"],
            });
            autocomplete.addListener("place_changed", () => {
              const place = autocomplete.getPlace();
              if (!place.geometry) return;
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              map.setCenter({ lat, lng });
              map.setZoom(16);
              apply(lat, lng, place.formatted_address || place.name || input.value);
            });
            setPlacesReady(true);
          } catch {
            setPlacesReady(false);
          }
        }

        if (initialValueRef.current) {
          geocoder.geocode({ address: initialValueRef.current }, (results, code) => {
            const location = code === "OK" ? results?.[0]?.geometry?.location : undefined;
            if (!location) return;
            const lat = location.lat();
            const lng = location.lng();
            map.setCenter({ lat, lng });
            map.setZoom(16);
            marker.setPosition({ lat, lng });
          });
        }

        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load the map.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa2b1]" />
        <input
          ref={inputRef}
          className="input"
          style={{ paddingLeft: "2.75rem" }}
          name={name}
          type="text"
          defaultValue={value}
          required={required}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder ?? "Search for a location"}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          onChange={(event) => onChangeRef.current({ address: event.target.value, lat: "", lng: "" })}
        />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#d9e3f2]" style={{ height: 220 }}>
        <div ref={mapRef} className="h-full w-full" />
        {status !== "ready" ? (
          <div className="absolute inset-0 grid place-items-center bg-white/85 px-4 text-center text-xs font-semibold text-[#708099]">
            {status === "error" ? "Map unavailable — type the address above." : "Loading map…"}
          </div>
        ) : null}
      </div>

      {status === "error" ? (
        <p className="text-xs text-[#AC242A]">{error} You can still enter the address manually.</p>
      ) : placesReady ? (
        <p className="text-xs text-[#708099]">Search, or tap the map / drag the pin to set the location. Coordinates are saved with the address.</p>
      ) : (
        <p className="text-xs text-[#B45309]">
          Address search is off (enable the Places API for your key). You can still tap the map or drag the pin to set the location.
        </p>
      )}
    </div>
  );
}
