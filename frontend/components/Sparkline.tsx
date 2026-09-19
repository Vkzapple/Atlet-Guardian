interface SparklineProps {
  values: number[];
  color: string;
  filled?: boolean;
}

export default function Sparkline({ values, color, filled = false }: SparklineProps) {
  if (values.length < 2) {
    return <div className="h-8 w-full" />;
  }

  const width = 120;
  const height = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const gradientId = `spark-${color.replace("#", "")}`;

  const coords = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return [x, y] as const;
  });

  const points = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const areaPath = `M${coords[0][0]},${height} L${points
    .split(" ")
    .join(" L")} L${coords[coords.length - 1][0]},${height} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {filled && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {filled && <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}