import { formatMoney } from "@/lib/utils";

export type ChartPoint = { label: string; cents: number };

const CATEGORY_COLORS = ["#1E4488", "#0076AF", "#FFCF00", "#AC242A"];

export function TrendChart({ data, currency }: { data: ChartPoint[]; currency: string }) {
  const max = Math.max(1, ...data.map((point) => point.cents));
  const width = 720;
  const height = 240;
  const padX = 24;
  const padTop = 16;
  const padBottom = 34;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;
  const gap = 8;
  const barW = data.length ? (plotW - gap * (data.length - 1)) / data.length : 0;

  if (!data.length) {
    return <p className="py-10 text-center text-sm text-[#708099]">No revenue data for the selected period.</p>;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Monthly verified revenue">
      {[0, 0.5, 1].map((ratio) => {
        const y = padTop + plotH - plotH * ratio;
        return <line key={ratio} x1={padX} x2={width - padX} y1={y} y2={y} stroke="#e3eaf4" strokeWidth={1} />;
      })}
      {data.map((point, index) => {
        const barHeight = max ? (point.cents / max) * plotH : 0;
        const x = padX + index * (barW + gap);
        const y = padTop + (plotH - barHeight);
        return (
          <g key={point.label}>
            <rect x={x} y={y} width={barW} height={barHeight} rx={4} fill="#1E4488">
              <title>{`${point.label}: ${formatMoney(point.cents, currency)}`}</title>
            </rect>
            <text x={x + barW / 2} y={height - 12} textAnchor="middle" fontSize="11" fill="#708099">
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function CategoryChart({ data, currency }: { data: ChartPoint[]; currency: string }) {
  const max = Math.max(1, ...data.map((point) => point.cents));
  return (
    <div className="space-y-4">
      {data.map((point, index) => (
        <div key={point.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[#1B365F]">{point.label}</span>
            <span className="font-semibold text-[#52657A]">{formatMoney(point.cents, currency)}</span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#EEF3FA]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(point.cents / max) * 100}%`, backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
