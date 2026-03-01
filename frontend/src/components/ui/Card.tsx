import * as React from "react";
import { cn } from "../../utils/helpers";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
}

export function Card({ className, hoverLift = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-senti-border bg-senti-card/70 shadow-xl backdrop-blur",
        hoverLift && "transition-transform hover:-translate-y-1",
        className
      )}
      {...props}
    />
  );
}

