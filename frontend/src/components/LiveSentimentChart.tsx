import { useState } from "react";
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

export function LiveSentimentChart() {
  const [data] = useState(() => generateLiveData());

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-neon"
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground">Live Sentiment Trends</h2>
        <p className="text-sm text-muted-foreground">Real-time brand sentiment analysis</p>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="positiveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="neutralFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6b7280" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6b7280" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="negativeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="time"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [value.toFixed(1), ""]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Legend
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(value) => (
                <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.875rem" }}>{value}</span>
              )}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="positive"
              name="Positive"
              stroke={"#10b981"}
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
              stroke={"#6b7280"}
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
              stroke={"#f43f5e"}
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
