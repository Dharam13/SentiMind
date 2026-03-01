import * as React from "react";
import { cn } from "../../utils/helpers";

export function H1({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "text-4xl font-bold tracking-tight text-[rgb(var(--senti-text))] sm:text-5xl md:text-6xl",
        className
      )}
      {...props}
    />
  );
}

export function H2({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-2xl font-bold text-[rgb(var(--senti-text))] sm:text-3xl", className)} {...props} />
  );
}

export function Muted({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-senti-muted", className)} {...props} />;
}

