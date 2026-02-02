"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Mention {
  id: number;
  text: string;
  x: number;
  y: number;
  sentiment: "positive" | "neutral" | "negative";
}

const sampleMentions = [
  { text: "Love this brand!", sentiment: "positive" as const },
  { text: "Great product", sentiment: "positive" as const },
  { text: "Amazing service", sentiment: "positive" as const },
  { text: "Not bad", sentiment: "neutral" as const },
  { text: "Could be better", sentiment: "neutral" as const },
  { text: "Disappointed", sentiment: "negative" as const },
  { text: "Best purchase!", sentiment: "positive" as const },
  { text: "Highly recommend", sentiment: "positive" as const },
];

export function MentionBubbles() {
  const [mentions, setMentions] = useState<Mention[]>([]);

  useEffect(() => {
    // Initial burst of mentions
    const initialTimeout = setTimeout(() => {
      sampleMentions.slice(0, 3).forEach((mention, index) => {
        setTimeout(() => {
          const newMention: Mention = {
            id: Date.now() + index,
            text: mention.text,
            x: Math.random() * 280 + 60,
            y: Math.random() * 180 + 60,
            sentiment: mention.sentiment,
          };
          setMentions((prev) => [...prev, newMention]);
        }, index * 200);
      });
    }, 1000);

    // Continuous mentions
    const interval = setInterval(() => {
      const randomMention = sampleMentions[Math.floor(Math.random() * sampleMentions.length)];
      const newMention: Mention = {
        id: Date.now(),
        text: randomMention.text,
        x: Math.random() * 280 + 60,
        y: Math.random() * 180 + 60,
        sentiment: randomMention.sentiment,
      };
      
      setMentions((prev) => {
        // Keep only last 5 mentions
        const updated = [...prev, newMention];
        return updated.slice(-5);
      });
    }, 2000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-500/20 border-green-500/50 text-green-600 dark:text-green-400";
      case "negative":
        return "bg-red-500/20 border-red-500/50 text-red-600 dark:text-red-400";
      default:
        return "bg-yellow-500/20 border-yellow-500/50 text-yellow-600 dark:text-yellow-400";
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {mentions.map((mention) => (
        <motion.div
          key={mention.id}
          className={`absolute px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm ${getSentimentColor(
            mention.sentiment
          )}`}
          style={{
            left: `${mention.x}px`,
            top: `${mention.y}px`,
          }}
          initial={{
            opacity: 0,
            scale: 0,
            y: mention.y + 20,
          }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.7],
            y: mention.y - 40,
            x: mention.x + (Math.random() - 0.5) * 20,
          }}
          transition={{
            duration: 2.5,
            ease: "easeOut",
          }}
          onAnimationComplete={() => {
            setMentions((prev) => prev.filter((m) => m.id !== mention.id));
          }}
        >
          {mention.text}
        </motion.div>
      ))}
    </div>
  );
}
