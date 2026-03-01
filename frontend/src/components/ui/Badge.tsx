import * as React from "react";
import { cn } from "../../utils/helpers";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-senti-border bg-senti-card/60 px-3 py-1 text-xs font-semibold text-[rgb(var(--senti-text))]",
        className
      )}
      {...props}
    />
  );
}

