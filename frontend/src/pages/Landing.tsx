import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "../components/Header";
import { LiveSentimentChart } from "../components/LiveSentimentChart";

const sources = [
  { icon: "𝕏", label: "Twitter" },
  { icon: "r/", label: "Reddit" },
  { icon: "📰", label: "News" },
  { icon: "▶", label: "YouTube" },
  { icon: "M", label: "Medium" },
];

const stats = [
  { value: "1.2M+", label: "Mentions Processed", color: "text-blue-600 dark:text-blue-400" },
  { value: "98%", label: "Detection Accuracy", color: "text-emerald-600 dark:text-emerald-400" },
  { value: "5+", label: "Data Sources", color: "text-indigo-600 dark:text-indigo-400" },
];

const features = [
  {
    title: "Real-Time Tracking",
    description: "Monitor brand mentions across multiple platforms and track sentiment changes as they happen.",
    icon: "⚡",
  },
  {
    title: "Sentiment Analysis",
    description: "Understand public perception with AI-powered sentiment analysis and emotional intelligence scoring.",
    icon: "📊",
  },
  {
    title: "Multi-Platform Monitoring",
    description: "Track mentions from Twitter, Reddit, News, YouTube, Medium, LinkedIn, and more.",
    icon: "🌐",
  },
  {
    title: "Influencer Identification",
    description: "Identify key influencers discussing your brand and measure their impact on conversations.",
    icon: "⭐",
  },
  {
    title: "Actionable Insights",
    description: "Get detailed reports and recommendations to improve your brand strategy and reputation.",
    icon: "💡",
  },
  {
    title: "Custom Alerts",
    description: "Set up customized notifications for specific keywords, sentiment patterns, or spike events.",
    icon: "🔔",
  },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 dark:opacity-20" />
      
      <Header />

      <main className="relative pt-14">
        {/* Hero Section */}
        <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 py-24 text-center">
          <div className="mx-auto max-w-4xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-foreground"
            >
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
              </span>
              Live Brand Intelligence Platform
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            >
              Understand Your Brand's{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400">
                True Voice
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6 text-lg font-medium text-foreground sm:text-xl"
            >
              Real-time sentiment analysis across all platforms
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-12 text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed"
            >
              Monitor brand mentions, analyze sentiment, and gain actionable insights from news, social media, and blogs. 
              Join thousands of brands using Sentimind to track their reputation in real-time.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-16 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center"
            >
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition duration-300"
              >
                Get Started Free
                <span>→</span>
              </Link>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-8 py-4 text-lg font-semibold text-foreground hover:bg-muted transition duration-300"
              >
                Schedule Demo
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="grid grid-cols-3 gap-6 sm:gap-8 mb-16"
            >
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col items-center"
                >
                  <div className={`text-3xl sm:text-4xl font-bold mb-2 ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground text-center">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Source badges */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              <span className="text-sm text-muted-foreground font-medium">Monitoring from:</span>
              {sources.map((source) => (
                <span
                  key={source.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-card transition"
                >
                  <span className="text-sm">{source.icon}</span>
                  {source.label}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Live Chart Section */}
        <section className="relative border-t border-border px-4 py-16 bg-muted/20">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12 text-center"
            >
              <h2 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
                Real-Time Analytics
              </h2>
              <p className="text-lg text-muted-foreground">
                Monitor sentiment trends and mention spikes as they happen
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <LiveSentimentChart />
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="relative px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16 text-center"
            >
              <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
                Powerful Capabilities
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to track, analyze, and act on brand sentiment in real-time.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="group rounded-xl border border-border bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 p-6 sm:p-8 hover:border-primary/50 hover:shadow-lg transition duration-300"
                >
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-2xl group-hover:bg-primary/10 transition">
                    {feature.icon}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative border-t border-border px-4 py-16 sm:py-20 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
                Ready to understand your brand better?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Start analyzing brand sentiment in minutes. No credit card required.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-10 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition duration-300"
              >
                Start Free Trial
                <span>→</span>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-border px-4 py-12 bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 mb-8">
              <div>
                <h4 className="mb-4 font-semibold text-foreground">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition">Features</a></li>
                  <li><a href="#" className="hover:text-foreground transition">Pricing</a></li>
                  <li><a href="#" className="hover:text-foreground transition">Status</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold text-foreground">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition">About</a></li>
                  <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
                  <li><a href="#" className="hover:text-foreground transition">Careers</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold text-foreground">Resources</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition">Docs</a></li>
                  <li><a href="#" className="hover:text-foreground transition">Support</a></li>
                  <li><a href="#" className="hover:text-foreground transition">API</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold text-foreground">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
                  <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
                  <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">Sentimind</p>
                <p className="text-sm text-muted-foreground">Real-time Brand Sentiment Analysis</p>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Sentimind. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
