"use client";

export function WeightSparkline({
  data,
  width = 120,
  height = 40,
}: {
  data: { weekOf: string; weight: number }[];
  width?: number;
  height?: number;
}) {
  if (data.length === 0) return null;

  const padding = 4;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  if (data.length === 1) {
    return (
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Weight: ${data[0].weight} lbs`}
      >
        <circle
          cx={width / 2}
          cy={height / 2}
          r={3}
          className="fill-zinc-600 dark:fill-zinc-400"
        />
      </svg>
    );
  }

  // Data comes newest-first; reverse for left-to-right chronological
  const sorted = [...data].reverse();
  const weights = sorted.map((d) => d.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const points = sorted.map((d, i) => {
    const x = padding + (i / (sorted.length - 1)) * innerW;
    const y = padding + innerH - ((d.weight - minW) / range) * innerH;
    return { x, y };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  const label = `Weight trend: ${sorted.map((d) => `${d.weight} lbs`).join(", ")}`;

  return (
    <svg width={width} height={height} role="img" aria-label={label}>
      <polyline
        points={polyline}
        fill="none"
        strokeWidth={1.5}
        className="stroke-zinc-500 dark:stroke-zinc-400"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={2.5}
          className="fill-zinc-600 dark:fill-zinc-400"
        />
      ))}
    </svg>
  );
}
