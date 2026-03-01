import * as React from "react";
import { cn } from "../../utils/helpers";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-senti-border bg-senti-dark/40 px-4 text-sm text-[rgb(var(--senti-text))] placeholder:text-senti-muted focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple/40",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

