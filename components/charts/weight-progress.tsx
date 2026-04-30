"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type WeightDataPoint = { date: string; weight: number };

/**
 * Format a date string like "Feb 17" → "Feb 17", but thin it out
 * so only a few labels show on mobile. Recharts handles this via
 * interval="preserveStartEnd" but we also shorten month names.
 */
function formatAxisDate(dateStr: string) {
  // dateStr is typically "Mon DD" or "YYYY-MM-DD"
  // If it's already short like "Feb 17", keep it
  return dateStr;
}

export function WeightProgress({
  data,
  className,
}: {
  data: WeightDataPoint[];
  /** @deprecated clientId is no longer needed — range selector removed */
  clientId?: string;
  className?: string;
}) {
  if (data.length < 2) {
    return (
      <div className={className}>
        <p className="text-sm text-zinc-400">
          Not enough data to display a chart. Submit at least 2 check-ins with
          weight.
        </p>
      </div>
    );
  }

  const weights = data.map((d) => d.weight);
  const minW = Math.floor(Math.min(...weights) - 1);
  const maxW = Math.ceil(Math.max(...weights) + 1);

  // Compute a clean tick count — aim for 3-4 ticks
  const yTickCount = Math.min(4, maxW - minW + 1);

  return (
    <div className={className} role="img" aria-label="Weight progress chart">
      {/* Chart — clean area fill */}
      <div className="h-40 sm:h-52 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.20} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="0"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#52525b" }}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={40}
              tickFormatter={formatAxisDate}
            />
            <YAxis
              domain={[minW, maxW]}
              tick={{ fontSize: 10, fill: "#52525b" }}
              tickLine={false}
              axisLine={false}
              tickCount={yTickCount}
              tickMargin={4}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(24, 24, 27, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                fontSize: "12px",
                backdropFilter: "blur(12px)",
                padding: "8px 12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
              labelStyle={{ color: "#71717a", fontSize: "11px", marginBottom: "2px" }}
              itemStyle={{ color: "#fafafa", fontWeight: 600 }}
              cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#weightGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#3b82f6",
                stroke: "#0a0f1e",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
