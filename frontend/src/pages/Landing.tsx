import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "../components/Header";
import { LiveSentimentChart } from "../components/LiveSentimentChart";

const sources = [
  { icon: "🐦", label: "Social Media" },
  { icon: "📰", label: "News" },
  { icon: "📡", label: "Blogs" },
];

const stats = [
  { value: "0K+", label: "Brands" },
  { value: "1+", label: "Mentions" },
  { value: "98%", label: "Accuracy" },
];

const features = [
  {
    title: "Real-Time Tracking",
    description:
      "Monitor brand mentions across news, social media, and blogs as they happen. Never miss a conversation about your brand.",
    icon: "📡",
  },
  {
    title: "Sentiment Analysis",
    description:
      "AI-powered sentiment scoring powered by BERT. Understand positive, neutral, and negative sentiment at a glance.",
    icon: "📊",
  },
  {
    title: "Actionable Insights",
    description:
      "Turn data into decisions. Get clear, actionable insights to improve your brand health and customer perception.",
    icon: "💡",
  },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-senti-dark">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-senti-dark to-senti-dark" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
      <Header />

      <main className="relative pt-14">
        {/* Hero */}
        <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-senti-purple/90 px-4 py-2 text-sm font-medium text-white shadow-lg"
            >
              <span>⚡</span>
              AI-Powered Sentiment Intelligence
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl md:text-7xl"
            >
              Sentimind
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mb-3 text-xl font-medium text-gray-200 sm:text-2xl"
            >
              The one-stop shop for your brand insights.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="mb-10 text-base text-gray-400 sm:text-lg"
            >
              With advanced AI-powered capabilities, Sentimind is the only tool you need to understand your brand health in minutes. Track mentions, analyze sentiment, and gain actionable insights across news, social media, and blogs—all in real-time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.32 }}
              className="mb-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
            >
              <div className="rounded-xl border border-senti-border bg-senti-card/80 px-6 py-4 text-center">
                <div className="text-3xl font-bold text-senti-purple sm:text-4xl">
                  1,248,933
                </div>
                <div className="text-sm text-gray-400">Mentions Analyzed</div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {sources.map((s) => (
                  <span
                    key={s.label}
                    className="flex items-center gap-2 rounded-lg border border-senti-border bg-senti-card/80 px-4 py-2 text-sm text-gray-200"
                  >
                    <span>{s.icon}</span>
                    {s.label}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-12 flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-senti-purple to-senti-blue px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-purple-500/30"
              >
                Get Started
                <span className="text-xl">→</span>
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-500 bg-transparent px-8 py-4 text-lg font-semibold text-white transition-colors hover:border-gray-400 hover:bg-white/5"
              >
                Watch Demo
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-6 sm:gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 + index * 0.06 }}
                  className="text-center"
                >
                  <div className="bg-gradient-to-r from-senti-purple to-senti-blue bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="relative border-t border-senti-border bg-senti-card/20 px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-14 text-center"
            >
              <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
                Powerful Features
              </h2>
              <p className="text-lg text-gray-400">
                Everything you need to understand your brand&apos;s sentiment
              </p>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="rounded-2xl border border-senti-border bg-senti-dark/80 p-6 transition-colors hover:border-senti-purple/40 hover:bg-senti-card/40"
                >
                  <div className="mb-4 text-3xl">{feature.icon}</div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Sentiment Trends */}
        <section className="relative px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <LiveSentimentChart />
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-senti-border px-4 py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
            <Link
              to="/"
              className="bg-gradient-to-r from-senti-purple to-senti-blue bg-clip-text text-lg font-semibold text-transparent"
            >
              Sentimind
            </Link>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Sentimind. Brand sentiment analysis platform.
            </p>
            <div className="flex gap-6">
              <Link
                to="/login"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Sign up
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
