import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "../components/Header";
import { LiveSentimentChart } from "../components/LiveSentimentChart";
import {
  BarChart3,
  Globe,
  Star,
  ArrowRight,
  Newspaper,
  CreditCard,
  Cpu,
  TrendingUp,
  Sparkles,
  Layers,
  Activity,
  Twitter,
  MessageSquare,
  Youtube,
  Linkedin,
  BookOpen,
} from "lucide-react";

const sources = [
  { icon: <Twitter className="h-4 w-4 text-sky-400" />, label: "X / Twitter", color: "hover:border-sky-500/50" },
  { icon: <MessageSquare className="h-4 w-4 text-orange-400" />, label: "Reddit", color: "hover:border-orange-500/50" },
  { icon: <Newspaper className="h-4 w-4 text-blue-400" />, label: "Global News", color: "hover:border-blue-500/50" },
  { icon: <Youtube className="h-4 w-4 text-red-400" />, label: "YouTube", color: "hover:border-red-500/50" },
  { icon: <Linkedin className="h-4 w-4 text-blue-500" />, label: "LinkedIn", color: "hover:border-blue-600/50" },
  { icon: <BookOpen className="h-4 w-4 text-emerald-400" />, label: "Medium", color: "hover:border-emerald-500/50" },
];

const stats = [
  { value: "1.2M+", label: "Mentions Analyzed", color: "text-neon-cyan" },
  { value: "6", label: "Connected Platforms", color: "text-neon-violet" },
  { value: "< 5 Min", label: "Crisis Response Time", color: "text-neon-emerald" },
  { value: "3.8x", label: "Average Retention ROI", color: "text-neon-amber" },
];

const workflowStages = [
  {
    id: 1,
    title: "1. Discover",
    role: "Omnichannel Social Discovery",
    badge: "Unified Listening",
    description: "Continuously tracks and unifies customer discussions, reviews, and sentiment across Twitter/X, Reddit, LinkedIn, YouTube, and Global News.",
    icon: <Globe className="h-5 w-5 text-neon-cyan" />,
    detail: "Eliminates brand blind spots by consolidating scattered public mentions into a single real-time intelligence stream.",
  },
  {
    id: 2,
    title: "2. Understand",
    role: "Deep Sentiment & Intent Analysis",
    badge: "Intent Classification",
    description: "Instantly interprets tone, urgency, and customer emotions behind every mention to separate constructive feedback from viral brand risks.",
    icon: <Cpu className="h-5 w-5 text-neon-violet" />,
    detail: "Accurately categorizes mentions by business priority: urgent complaints, churn threats, direct purchase intent, and brand praise.",
  },
  {
    id: 3,
    title: "3. Detect",
    role: "Proactive Crisis Detection",
    badge: "Anomaly Alerts",
    description: "Compares live discussion velocity against historical baselines to alert your team to emerging brand friction or sudden viral advocacy surges.",
    icon: <Activity className="h-5 w-5 text-neon-amber" />,
    detail: "Prevents customer churn by catching negative spikes hours before they trend publicly or cause reputation damage.",
  },
  {
    id: 4,
    title: "4. Diagnose",
    role: "AI Root-Cause Intelligence",
    badge: "Executive Insights",
    description: "Pinpoints exact customer friction drivers, affected products, and specific pain points using advanced generative intelligence.",
    icon: <Sparkles className="h-5 w-5 text-neon-rose" />,
    detail: "Delivers clear, actionable diagnosis summaries that tell your leadership team exactly why sentiment shifted and what customers need.",
  },
  {
    id: 5,
    title: "5. Recover & Sell",
    role: "Conversational Commerce",
    badge: "Automated Action",
    description: "Automatically formulates bounded recovery campaigns and issues personalized 1-click Razorpay checkout links or resolution vouchers.",
    icon: <CreditCard className="h-5 w-5 text-neon-emerald" />,
    detail: "Protects your bottom line with built-in guardrails: anti-abuse credibility gates, discount caps, and daily budget limits.",
  },
  {
    id: 6,
    title: "6. Measure ROI",
    role: "Closed-Loop Attribution",
    badge: "Revenue & Impact",
    description: "Tracks real payment conversions, revenue won, and customer sentiment recovery directly within the live executive dashboard.",
    icon: <TrendingUp className="h-5 w-5 text-neon-cyan" />,
    detail: "Demonstrates tangible business return on investment by measuring side-by-side sentiment shifts and verified converted revenue.",
  },
];

const features = [
  {
    title: "Autonomous Customer Retention",
    description: "Turn customer frustration into brand loyalty. AI detects complaints, diagnoses root causes, and deploys targeted retention vouchers in seconds.",
    icon: <Sparkles className="h-6 w-6" />,
    color: "text-neon-amber",
  },
  {
    title: "Enterprise Brand Protection",
    description: "Built for high-scale brands. Instantly processes massive viral spikes without delay, safeguarding reputation when seconds count.",
    icon: <Cpu className="h-6 w-6" />,
    color: "text-neon-cyan",
  },
  {
    title: "Precision Intent Intelligence",
    description: "Understands nuance and emotion. Accurately distinguishes between casual commentary, urgent churn threats, and hot buyer intent.",
    icon: <BarChart3 className="h-6 w-6" />,
    color: "text-neon-violet",
  },
  {
    title: "Instant Conversational Commerce",
    description: "Capture social buying intent on the spot. Deliver direct 1-click Razorpay checkout links into social discussions and win instant sales.",
    icon: <CreditCard className="h-6 w-6" />,
    color: "text-neon-emerald",
  },
  {
    title: "Omnichannel Social Listening",
    description: "Consolidate brand discussions across YouTube, Reddit, Global News, LinkedIn, Medium, and Twitter/X into one central dashboard.",
    icon: <Globe className="h-6 w-6" />,
    color: "text-neon-rose",
  },
  {
    title: "Influencer Authority & Reach",
    description: "Identify high-impact creators and critics shaping brand perception with verified reach metrics, audience size, and sentiment leanings.",
    icon: <Star className="h-6 w-6" />,
    color: "text-neon-amber",
  },
];

export function Landing() {
  const [activeStage, setActiveStage] = useState(1);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Dynamic Grid Background Pattern */}
      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

      <Header />

      <main className="relative pt-14">
        {/* ─── Hero Section ─── */}
        <section className="relative flex min-h-[92vh] flex-col items-center justify-center px-4 py-20 text-center overflow-hidden">
          <div className="mx-auto max-w-5xl">
            {/* Top Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs sm:text-sm font-semibold text-primary backdrop-blur-md shadow-neon"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              Event-Driven Brand Intelligence & Autonomous Commerce
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.15]"
            >
              From Social Sentiment to{" "}
              <span className="bg-gradient-to-r from-neon-cyan via-primary to-neon-violet bg-clip-text text-transparent">
                Instant Commerce Action
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6 text-lg sm:text-2xl font-medium text-foreground/90 max-w-3xl mx-auto"
            >
              Listen across 6 platforms. Detect sentiment anomalies. Execute recovery campaigns with AI.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-10 text-sm sm:text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto"
            >
              SentiMind transforms scattered social chatter into <strong>actionable customer recovery</strong> and <strong>instant conversational sales</strong>, turning public friction into brand loyalty and spontaneous praise into 1-click checkout revenue.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-16 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-neon-lg hover:shadow-neon hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Launch Live Dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/80 backdrop-blur-sm px-8 py-4 text-base font-semibold text-foreground hover:bg-muted hover:border-primary/40 transition-all duration-300"
              >
                Sign In to SentiMind
              </Link>
            </motion.div>

            {/* Key Metrics Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-12"
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4 sm:p-5 flex flex-col items-center text-center shadow-sm hover:border-border transition"
                >
                  <div className={`text-2xl sm:text-3xl font-extrabold mb-1 tracking-tight ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Source Badges */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
            >
              <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                Real-Time Ingestion:
              </span>
              {sources.map((source) => (
                <span
                  key={source.label}
                  className={`inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-foreground backdrop-blur-sm shadow-sm transition-all duration-200 ${source.color}`}
                >
                  <span className="flex items-center">{source.icon}</span>
                  {source.label}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── Interactive 6-Stage Autonomous Engine Section ─── */}
        <section className="relative border-t border-border/50 px-4 py-20 sm:py-28 bg-gradient-to-b from-muted/20 via-card/30 to-background">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-2">
                <Layers className="h-4 w-4" /> The Closed-Loop Intelligence Engine
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                How SentiMind Drives ROI
              </h2>
              <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                A seamless 6-step system connecting multi-platform social listening to automated customer retention and commerce.
              </p>
            </div>

            {/* Stepper Navigation Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-8">
              {workflowStages.map((stage) => {
                const isActive = activeStage === stage.id;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStage(stage.id)}
                    className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border text-center transition-all duration-300 ${
                    isActive
                        ? "border-primary bg-primary/10 shadow-neon text-foreground scale-105"
                        : "border-border/60 bg-card/60 hover:bg-card text-muted-foreground"
                    }`}
                  >
                    <div className="mb-1.5">{stage.icon}</div>
                    <span className="text-xs sm:text-sm font-bold truncate">{stage.title}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{stage.badge}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Stage Detail Card */}
            <AnimatePresence mode="wait">
              {workflowStages
                .filter((s) => s.id === activeStage)
                .map((stage) => (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl p-6 sm:p-10 shadow-neon-lg"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-border/60 pb-6">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 shadow-neon">
                          {stage.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-2xl font-bold text-foreground">{stage.title}</h3>
                            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                              {stage.badge}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
                            Capability: {stage.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          Active in Pipeline
                        </span>
                      </div>
                    </div>

                    <p className="text-base sm:text-lg text-foreground/90 font-medium mb-4 leading-relaxed">
                      {stage.description}
                    </p>

                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                      <strong className="text-foreground">Business Value: </strong>
                      {stage.detail}
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </section>

        {/* ─── Live Sentiment Chart Preview ─── */}
        <section className="relative border-t border-border/40 px-4 py-20 bg-muted/10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-neon-cyan">Real-Time Data</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mt-1">
                Live Brand Sentiment Visualizer
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                Dynamic area and stream charts illustrating real-time positive, neutral, and negative shifts.
              </p>
            </div>

            <LiveSentimentChart />
          </div>
        </section>

        {/* ─── Powerful Capabilities Grid ─── */}
        <section className="relative px-4 py-20 sm:py-28 border-t border-border/40">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Enterprise Ready</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mt-1">
                Engineered for High-Scale Brands
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mt-2">
                Every component built for speed, resilience, and actionable business ROI.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm p-6 sm:p-8 hover:border-primary/50 hover:shadow-neon transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 border border-border ${feature.color}`}>
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-foreground">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Bottom CTA ─── */}
        <section className="relative border-t border-border/40 px-4 py-20 bg-gradient-to-b from-primary/10 via-background to-background text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
              Transform Your Brand Intelligence Today
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Monitor live mentions, diagnose friction with Gemini AI, and automate recovery campaigns in seconds.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-10 py-4 text-base font-bold text-primary-foreground shadow-neon-lg hover:shadow-neon hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="relative border-t border-border/40 px-4 py-12 bg-muted/20">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <p className="font-extrabold text-lg text-foreground">SentiMind</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Autonomous Brand Sentiment Intelligence & Real-Time Commerce
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SentiMind. Autonomous Brand Intelligence & Conversational Commerce.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
