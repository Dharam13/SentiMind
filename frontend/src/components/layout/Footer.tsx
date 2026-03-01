import { Link } from "react-router-dom";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t border-senti-border bg-senti-dark/40 py-8">
      <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Link
          to="/"
          className="bg-gradient-to-r from-senti-purple to-senti-blue bg-clip-text text-lg font-semibold text-transparent"
        >
          Sentimind
        </Link>
        <p className="text-sm text-senti-muted">
          © {new Date().getFullYear()} Sentimind. Brand sentiment analysis platform.
        </p>
        <div className="flex gap-6">
          <Link to="/login" className="text-sm text-senti-muted transition-colors hover:text-[rgb(var(--senti-text))]">
            Login
          </Link>
          <Link to="/signup" className="text-sm text-senti-muted transition-colors hover:text-[rgb(var(--senti-text))]">
            Sign up
          </Link>
        </div>
      </Container>
    </footer>
  );
}

