import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { Activity, LogOut } from "lucide-react";

export function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <Activity className="h-5 w-5 text-primary" />
          <span className="gradient-text">Sentimind</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {!loading &&
            (user ? (
              <>
                <span className="hidden max-w-[180px] truncate text-sm text-muted-foreground sm:inline">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-neon transition hover:opacity-90"
                >
                  Sign up
                </Link>
              </>
            ))}
        </nav>
      </div>
    </header>
  );
}
