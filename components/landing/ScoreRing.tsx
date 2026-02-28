export default function ScoreRing({ score }: { score: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color =
    score >= 70 ? "#22c55e" :
    score >= 45 ? "#eab308" : "#ef4444";
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
        <circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
        />
      </svg>
      <div className="text-center">
        <div className="font-mono font-semibold text-xl leading-none" style={{ color }}>
          {score}
        </div>
        <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">
          /100
        </div>
      </div>
    </div>
  );
}
