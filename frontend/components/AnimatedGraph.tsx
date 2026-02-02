"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface DataPoint {
  x: number;
  y: number;
  value: number;
}

export function AnimatedGraph() {
  const [animatedData, setAnimatedData] = useState<DataPoint[]>([]);
  const [currentValue, setCurrentValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  // Generate initial data points (7 points for a week)
  const generateData = (): DataPoint[] => {
    const points: DataPoint[] = [];
    const width = 400;
    const height = 300;
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    for (let i = 0; i < 7; i++) {
      const x = padding + (i / 6) * graphWidth;
      // Simulate growth trend
      const baseValue = 50 + i * 15 + Math.random() * 20;
      const y = height - padding - (baseValue / 200) * graphHeight;
      points.push({
        x,
        y,
        value: Math.round(baseValue),
      });
    }
    return points;
  };

  useEffect(() => {
    const data = generateData();
    
    // Animate data points appearing one by one
    data.forEach((point, index) => {
      setTimeout(() => {
        setAnimatedData((prev) => [...prev, point]);
        // Animate counter
        const startValue = index > 0 ? data[index - 1].value : 0;
        const endValue = point.value;
        const duration = 300;
        const steps = 20;
        const stepValue = (endValue - startValue) / steps;
        let currentStep = 0;
        
        const counterInterval = setInterval(() => {
          currentStep++;
          const current = Math.round(startValue + stepValue * currentStep);
          setCurrentValue(Math.min(current, endValue));
          
          if (currentStep >= steps) {
            clearInterval(counterInterval);
            setCurrentValue(endValue);
            if (index === data.length - 1) {
              setIsAnimating(false);
            }
          }
        }, duration / steps);
      }, index * 400);
    });
  }, []);

  // Generate path string for the line
  const generatePath = (points: DataPoint[]): string => {
    if (points.length < 2) return "";
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = cp1x;
      const cp2y = curr.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  // Generate area path for gradient fill
  const generateAreaPath = (points: DataPoint[]): string => {
    if (points.length < 2) return "";
    const path = generatePath(points);
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    return `${path} L ${lastPoint.x} 260 L ${firstPoint.x} 260 Z`;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        width="400"
        height="300"
        viewBox="0 0 400 300"
        className="w-full h-auto"
      >
        {/* Grid lines */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1="40"
            y1={40 + i * 55}
            x2="360"
            y2={40 + i * 55}
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.1"
            className="text-gray-400 dark:text-gray-600"
          />
        ))}

        {/* Y-axis labels */}
        {[0, 50, 100, 150, 200].map((value, i) => (
          <text
            key={value}
            x="35"
            y={260 - i * 55}
            textAnchor="end"
            className="text-xs fill-gray-500 dark:fill-gray-400"
          >
            {value}
          </text>
        ))}

        {/* X-axis labels */}
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
          <text
            key={day}
            x={40 + (i / 6) * 320}
            y="285"
            textAnchor="middle"
            className="text-xs fill-gray-500 dark:fill-gray-400"
          >
            {day}
          </text>
        ))}

        {/* Area fill */}
        {animatedData.length > 1 && (
          <motion.path
            d={generateAreaPath(animatedData)}
            fill="url(#areaGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {/* Line */}
        {animatedData.length > 1 && (
          <motion.path
            d={generatePath(animatedData)}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        )}

        {/* Data points */}
        {animatedData.map((point, index) => (
          <motion.g key={index}>
            <motion.circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="url(#lineGradient)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.circle
              cx={point.x}
              cy={point.y}
              r="12"
              fill="url(#lineGradient)"
              fillOpacity="0.2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            />
          </motion.g>
        ))}
      </svg>

      {/* Current value display */}
      <motion.div
        className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mentions</div>
        <motion.div
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          key={currentValue}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {currentValue}
        </motion.div>
        <motion.div
          className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: isAnimating ? 1 : 0 }}
        >
          <motion.svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </motion.svg>
          Live
        </motion.div>
      </motion.div>
    </div>
  );
}
