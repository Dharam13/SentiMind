import { Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextLabel = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="group relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/80 backdrop-blur-sm text-foreground transition-all duration-300 hover:border-primary/40 hover:shadow-neon focus:outline-none focus:ring-2 focus:ring-primary/30"
      aria-label={nextLabel}
      title={nextLabel}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-neon-amber transition-transform duration-300 group-hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-accent transition-transform duration-300 group-hover:-rotate-12" />
      )}
    </button>
  );
}

