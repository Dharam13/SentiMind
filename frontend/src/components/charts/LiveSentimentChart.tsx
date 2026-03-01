import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

function generateLiveData() {
  const now = Date.now();
  const points = 24;
  const data = [];
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now - i * 60000);
    const positive = 52 + Math.sin(i * 0.4) * 12 + Math.random() * 6;
    const negative = 25 + Math.sin(i * 0.3) * 5 + Math.random() * 4;
    const neutral = Math.max(0, 100 - positive - negative);
    data.push({
      time: t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      positive: Math.round(positive * 10) / 10,
      neutral: Math.round(neutral * 10) / 10,
      negative: Math.round(negative * 10) / 10,
    });
  }
  return data;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  function dotClass(name?: string) {
    if (name === "Positive") return "bg-emerald-500";
    if (name === "Neutral") return "bg-gray-400";
    if (name === "Negative") return "bg-red-500";
    return "bg-senti-muted";
  }

  return (
    <div className="rounded-xl border border-senti-border bg-senti-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="mb-1 text-[rgb(var(--senti-text))]">Time: {label}</div>
      <div className="space-y-1 text-senti-muted">
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${dotClass(p.name)}`} />
              {p.name}
            </span>
            <span className="text-[rgb(var(--senti-text))]">{(p.value ?? 0).toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveSentimentChart() {
  const [data] = useState(() => generateLiveData());

  const chartConfig = useMemo(
    () => ({
      positive: { color: "#22c55e" },
      neutral: { color: "#6b7280" },
      negative: { color: "#ef4444" },
    }),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl border border-senti-border bg-senti-card/70 p-6 shadow-xl"
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[rgb(var(--senti-text))]">Live Sentiment Trends</h2>
        <p className="text-sm text-senti-muted">Real-time brand sentiment analysis</p>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="positiveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="neutralFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6b7280" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6b7280" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="negativeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--senti-border))" />
            <XAxis
              dataKey="time"
              stroke="rgb(var(--senti-muted))"
              tick={{ fill: "rgb(var(--senti-muted))", fontSize: 12 }}
              axisLine={{ stroke: "rgb(var(--senti-border))" }}
            />
            <YAxis
              stroke="rgb(var(--senti-muted))"
              tick={{ fill: "rgb(var(--senti-muted))", fontSize: 12 }}
              axisLine={{ stroke: "rgb(var(--senti-border))" }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(value) => <span className="text-sm text-senti-muted">{value}</span>}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="positive"
              name="Positive"
              stroke={chartConfig.positive.color}
              strokeWidth={2}
              fill="url(#positiveFill)"
              isAnimationActive
              animationDuration={1000}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="neutral"
              name="Neutral"
              stroke={chartConfig.neutral.color}
              strokeWidth={2}
              fill="url(#neutralFill)"
              isAnimationActive
              animationDuration={1000}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="negative"
              name="Negative"
              stroke={chartConfig.negative.color}
              strokeWidth={2}
              fill="url(#negativeFill)"
              isAnimationActive
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

