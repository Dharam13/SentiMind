import * as React from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-senti-dark text-senti-text">{children}</div>;
}

