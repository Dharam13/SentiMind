import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { AuthBackgroundChart } from "../components/ui/AuthBackgroundChart";

export function Signup() {
  const navigate = useNavigate();
  const { signup, user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (user) {
    navigate("/projects", { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup({
        firstName,
        lastName: lastName.trim() || null,
        email,
        password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="relative min-h-screen bg-senti-dark overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-senti-purple/10 via-senti-dark to-senti-dark z-0" />
        <AuthBackgroundChart />
        <Header />
        <main className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-14">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-senti-border bg-senti-card/90 p-8 text-center shadow-xl backdrop-blur"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-3xl text-green-400">
              ✓
            </div>
            <h1 className="mb-2 text-2xl font-bold font-semibold text-senti-text dark:text-white">Account created</h1>
            <p className="mb-6 text-senti-muted dark:text-gray-400">
              You can now sign in with your email and password.
            </p>
            <Link
              to="/login"
              className="inline-block w-full rounded-xl bg-gradient-to-r from-senti-purple to-senti-blue py-3 font-semibold text-white shadow-lg transition-shadow hover:shadow-purple-500/25"
            >
              Go to sign in
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-senti-dark overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-senti-purple/10 via-senti-dark to-senti-dark z-0" />
      <AuthBackgroundChart />
      <Header />
      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16 pt-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-senti-border bg-senti-card/90 p-8 shadow-xl backdrop-blur"
        >
          <Link
            to="/"
            className="mb-6 inline-block text-sm text-senti-muted transition-colors hover:text-senti-text dark:text-gray-400 dark:hover:text-white"
          >
            ← Back to home
          </Link>
          <h1 className="mb-2 text-3xl font-bold font-semibold text-senti-text dark:text-white">Create account</h1>
          <p className="mb-6 text-senti-muted dark:text-gray-400">
            Join Sentimind to track your brand sentiment
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-1 block text-sm font-semibold text-senti-placeholder dark:text-gray-300"
                >
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-senti-border bg-senti-dark px-4 py-3 text-senti-text placeholder-senti-placeholder dark:text-white dark:placeholder-gray-500 focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple"
                  placeholder="Jane"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="mb-1 block text-sm font-semibold text-senti-placeholder dark:text-gray-300"
                >
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-senti-border bg-senti-dark px-4 py-3 text-senti-text placeholder-senti-placeholder dark:text-white dark:placeholder-gray-500 focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-semibold text-senti-placeholder dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-senti-border bg-senti-dark px-4 py-3 text-senti-text placeholder-senti-placeholder dark:text-white dark:placeholder-gray-500 focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-semibold text-senti-placeholder dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-senti-border bg-senti-dark px-4 py-3 text-senti-text placeholder-senti-placeholder dark:text-white dark:placeholder-gray-500 focus:border-senti-purple focus:outline-none focus:ring-1 focus:ring-senti-purple"
                placeholder="At least 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-senti-purple to-senti-blue py-3 font-semibold text-white shadow-lg transition-opacity hover:shadow-purple-500/25 disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-senti-muted dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-senti-purple hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
