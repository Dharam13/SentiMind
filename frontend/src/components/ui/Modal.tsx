import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/helpers";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Modal"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "w-full max-w-md rounded-2xl border border-senti-border bg-senti-card/95 p-6 shadow-2xl backdrop-blur",
          className
        )}
      >
        {(title || description) && (
          <div className="mb-4">
            {title && <div className="text-lg font-semibold text-[rgb(var(--senti-text))]">{title}</div>}
            {description && <div className="mt-1 text-sm text-senti-muted">{description}</div>}
          </div>
        )}
        {children}
      </motion.div>
    </div>
  );
}

