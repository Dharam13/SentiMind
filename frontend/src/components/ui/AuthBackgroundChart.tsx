import { useMemo } from "react";
import { motion } from "framer-motion";

export function AuthBackgroundChart() {
    // Generate deterministic but realistic-looking LiveSentiment data
    const data = useMemo(() => {
        return Array.from({ length: 24 }).map((_, i) => {
            // Create a wave-like pattern of heights between 20% and 90%
            const baseHeight = 40 + Math.sin(i * 0.5) * 30 + Math.cos(i * 0.8) * 20;
            const height = Math.max(20, Math.min(95, baseHeight));

            // Enhanced neon green color classes with glow effect
            let colorClass = "bg-gradient-to-t from-green-600 to-green-500"; // neutral base
            let glowStyle = "shadow-[0_0_20px_rgba(34,197,94,0.6)]"; // neon glow
            
            if (height > 65) {
                colorClass = "bg-gradient-to-t from-green-500 to-green-400"; // high
                glowStyle = "shadow-[0_0_25px_rgba(34,197,94,0.8)]"; // stronger glow
            } else if (height < 35) {
                colorClass = "bg-gradient-to-t from-green-700 to-green-600"; // low
                glowStyle = "shadow-[0_0_15px_rgba(34,197,94,0.5)]"; // subtle glow
            }

            return {
                id: i,
                height: `${height}%`,
                value: Math.floor(height * 10),
                colorClass,
                glowStyle,
                label: `${i}:00`,
            };
        });
    }, []);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
            {/* Container for the chart bars */}
            <div className="absolute bottom-0 left-0 right-0 h-[60vh] flex items-end justify-between px-8 pb-12 opacity-80 dark:opacity-75">

                {/* Grid lines layout */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-12 border-b border-senti-border/30">
                    <div className="w-full h-px bg-senti-border/20 border-dashed" />
                    <div className="w-full h-px bg-senti-border/20 border-dashed" />
                    <div className="w-full h-px bg-senti-border/20 border-dashed" />
                    <div className="w-full h-px bg-senti-border/20 border-dashed" />
                </div>

                {/* The Bars */}
                {data.map((item, i) => (
                    <div
                        key={item.id}
                        className="group relative flex flex-col items-center justify-end h-full w-full max-w-[40px] px-1 md:px-2 cursor-crosshair"
                    >
                        {/* Tooltip (Visible on hover) */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileHover={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute -top-12 z-20 flex flex-col items-center opacity-0 transition-all duration-300 group-hover:opacity-100 pointer-events-none"
                        >
                            <div className="rounded bg-senti-card px-2 py-1 text-xs font-bold text-[rgb(var(--senti-text))] shadow-lg border border-senti-border">
                                {item.value}
                            </div>
                            <div className="h-1.5 w-1.5 rotate-45 bg-senti-card border-b border-r border-senti-border -mt-[4px]" />
                        </motion.div>

                        {/* Bar with neon glow effect */}
                        <motion.div
                            initial={{ height: "0%" }}
                            animate={{ height: item.height }}
                            transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
                            className={`w-full rounded-t-sm ${item.colorClass} ${item.glowStyle} transition-all duration-300`}
                            style={{
                                opacity: 0.85,
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
