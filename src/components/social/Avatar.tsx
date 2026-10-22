import { initials } from "@/lib/utils";

const TONES = [
  "bg-[#1E4488] text-[#FFCF00]",
  "bg-[#FFCF00] text-[#1B365F]",
  "bg-[#0076AF] text-white",
  "bg-[#7a2e3a] text-[#f7e7b0]",
  "bg-[#2f5d50] text-white",
];

const SIZES = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-32 w-32 text-4xl",
};

export function Avatar({
  id,
  name,
  size = "md",
  ring = false,
  src,
}: {
  id: number;
  name: string;
  size?: keyof typeof SIZES;
  ring?: boolean;
  src?: string | null;
}) {
  return (
    <span
      className={`grid shrink-0 select-none place-items-center overflow-hidden rounded-full font-bold ${TONES[id % TONES.length]} ${SIZES[size]} ${ring ? "ring-4 ring-white" : ""}`}
      aria-hidden
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </span>
  );
}
