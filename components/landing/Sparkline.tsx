export default function Sparkline({
  data,
  height = 52,
  color = "#6366f1",
  markerAt,
}: {
  data: number[];
  height?: number;
  color?: string;
  markerAt?: number;
}) {
  const W = 480;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = (subset: number[], startIdx: number) =>
    subset
      .map((v, i) => {
        const x = ((startIdx + i) / (data.length - 1)) * W;
        const y = height - ((v - min) / range) * (height - 6) - 3;
        return `${x},${y}`;
      })
      .join(" ");

  const allPts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return [x, y] as [number, number];
  });

  const areaPath = [
    `0,${height}`,
    ...allPts.map(([x, y]) => `${x},${y}`),
    `${W},${height}`,
  ].join(" ");

  const splitAt = markerAt ?? data.length;
  const beforePts = pts(data.slice(0, splitAt + 1), 0);
  const afterPts = pts(data.slice(splitAt), splitAt);
  const markerX = markerAt != null ? (markerAt / (data.length - 1)) * W : null;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPath} fill="url(#areaGrad)" />
      {markerAt != null && (
        <>
          <polyline
            points={beforePts}
            fill="none"
            stroke={`${color}55`}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points={afterPts}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      )}
      {markerAt == null && (
        <polyline
          points={pts(data, 0)}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {markerX != null && (
        <line
          x1={markerX} y1="0"
          x2={markerX} y2={height}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
      )}
    </svg>
  );
}
