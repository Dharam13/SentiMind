import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "../common/ThemeToggle";
import { Button } from "../ui/Button";
import { Container } from "./Container";

export function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="fixed left-0 right-0 top-0 z-40 h-14 border-b border-senti-border bg-senti-dark/70 shadow-lg backdrop-blur-sm">
      <Container className="flex h-full items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Placeholder for animated logo landing area */}
          <div className="flex h-8 w-[120px] items-center">
            <Link
              to="/"
              className="bg-gradient-to-r from-senti-purple to-senti-blue bg-clip-text text-lg font-semibold text-transparent"
            />
          </div>
        </div>

        <nav className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {!loading &&
            (user ? (
              <>
                <span className="hidden max-w-[220px] truncate text-sm text-senti-muted sm:block">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            ))}
        </nav>
      </Container>
    </header>
  );
}

