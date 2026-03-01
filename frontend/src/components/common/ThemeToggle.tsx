import { motion } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";
import { cn } from "../../utils/helpers";

export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "group relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-senti-border bg-senti-card/60 text-sm text-senti-muted transition-colors hover:bg-senti-card",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <motion.span
        key={isDark ? "moon" : "sun"}
        initial={{ opacity: 0, rotate: -25, scale: 0.9 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, rotate: 25, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="leading-none"
      >
        {isDark ? "🌙" : "☀️"}
      </motion.span>
    </button>
  );
}

