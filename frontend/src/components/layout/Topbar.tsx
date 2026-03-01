import * as React from "react";
import { cn } from "../../utils/helpers";

export function Topbar({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <header
      className={cn(
        "relative z-30 flex h-16 items-center justify-between border-b border-senti-border bg-senti-dark/70 px-4 backdrop-blur md:px-6",
        className
      )}
      {...props}
    />
  );
}

