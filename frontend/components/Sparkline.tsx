interface SparklineProps {
  values: number[];
  color: string;
  filled?: boolean;
}

// Catmull-Rom -> cubic Bezier, biar garis melengkung halus (bukan patah-patah)
function smoothPath(coords: readonly (readonly [number, number])[]) {
  if (coords.length < 2) return "";
  let d = `M${coords[0][0]},${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export default function Sparkline({ values, color, filled = false }: SparklineProps) {
  if (values.length < 2) {
    return <div className="h-9 w-full" />;
  }

  const width = 120;
  const height = 36;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const gradientId = `spark-${color.replace("#", "")}`;

  const coords = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = pad + (height - pad * 2) - ((value - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const linePath = smoothPath(coords);
  const areaPath = `${linePath} L${coords[coords.length - 1][0]},${height} L${coords[0][0]},${height} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {filled && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {filled && <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="3" fill={color} />
    </svg>
  );
}