export function BrandMark({
  light = false,
  name = "DeMolay Nexus",
  subtitle = "Philippines",
}: {
  light?: boolean;
  name?: string;
  subtitle?: string;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-white shadow-sm">
        <img
          src="/api/branding/logo"
          alt={`${name} logo`}
          className="h-full w-full object-contain"
        />
      </span>
      <span className="leading-tight">
        <span className={`block font-serif text-lg font-semibold ${light ? "text-white" : "text-[#1B365F]"}`}>
          {name}
        </span>
        <span className={`block text-[10px] font-semibold uppercase tracking-[0.18em] ${light ? "text-[#FFCF00]" : "text-[#0076AF]"}`}>
          {subtitle}
        </span>
      </span>
    </span>
  );
}
