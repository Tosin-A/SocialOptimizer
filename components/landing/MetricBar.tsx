export default function MetricBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color =
    value >= 7 ? "#22c55e" :
    value >= 4 ? "#eab308" : "#ef4444";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs w-10 text-right tabular-nums" style={{ color }}>
        {value}/10
      </span>
    </div>
  );
}
