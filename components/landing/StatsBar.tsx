import { STATS } from "@/lib/data/landing";

export default function StatsBar() {
  return (
    <div className="border-y border-white/[0.05] bg-white/[0.01] py-5 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {STATS.map((item) => (
          <div key={item.label}>
            <div className="font-mono font-semibold text-xl tabular-nums">{item.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
