import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-senti-border bg-senti-dark/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link
          to="/"
          className="bg-gradient-to-r from-senti-purple to-senti-blue bg-clip-text text-lg font-semibold text-transparent"
        >
          Sentimind
        </Link>
        <nav className="flex items-center gap-4">
          {!loading &&
            (user ? (
              <>
                <span className="max-w-[180px] truncate text-sm text-gray-400">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-senti-border hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-senti-border hover:text-white"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-gradient-to-r from-senti-purple to-senti-blue px-4 py-2 text-sm font-medium text-white shadow-lg transition-shadow hover:shadow-purple-500/25"
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
