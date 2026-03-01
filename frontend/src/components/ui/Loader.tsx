import { motion } from "framer-motion";
import { cn } from "../../utils/helpers";

export function Loader({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-sm text-senti-muted", className)}>
      <motion.span
        className="inline-block h-2 w-2 rounded-full bg-senti-purple"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <motion.span
        className="inline-block h-2 w-2 rounded-full bg-senti-blue"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
      />
      <motion.span
        className="inline-block h-2 w-2 rounded-full bg-senti-purple"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  );
}

