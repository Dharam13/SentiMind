import { motion } from "framer-motion";
import { cn } from "../../utils/helpers";

export function AnimatedText({
  text,
  className,
  stagger = 0.03,
}: {
  text: string;
  className?: string;
  stagger?: number;
}) {
  const letters = Array.from(text);

  return (
    <motion.span
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
      className={cn("inline-block", className)}
      aria-label={text}
      role="text"
    >
      {letters.map((ch, idx) => (
        <motion.span
          key={`${ch}-${idx}`}
          variants={{
            hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)" },
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-block"
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </motion.span>
  );
}

