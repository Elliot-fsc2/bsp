import { MapPin } from "lucide-react";

export function MapViewButton({ latitude, longitude, address }: { latitude?: string | null; longitude?: string | null; address?: string | null }) {
  const href =
    latitude && longitude
      ? `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}`
      : address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
        : null;
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ color: "#ffffff" }}
      className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#1E4488] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1B365F]"
    >
      <MapPin size={14} className="shrink-0" /> View on Google Maps
    </a>
  );
}
