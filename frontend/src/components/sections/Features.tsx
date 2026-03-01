import { motion } from "framer-motion";
import { Container } from "../layout/Container";
import { Card } from "../ui/Card";
import { H2 } from "../ui/Typography";

const features = [
  {
    title: "Track Hashtags",
    description:
      "Track various hashtags and find influencers. Measure the effects of a hashtag campaign, like reach and engagement.",
    icon: "#",
    accentClasses: "bg-sky-500/15 text-sky-400",
  },
  {
    title: "Analyse Reach & Sentiment",
    description:
      "Analyse the reach and sentiment of your brand. Understand how users perceive your brand with detailed sentiment analysis and influencer scoring.",
    icon: "📊",
    accentClasses: "bg-purple-500/15 text-purple-400",
  },
  {
    title: "Real-Time Alerts",
    description:
      "React in real-time with customised alerts. Stay informed about brand mentions and sentiment changes as they happen.",
    icon: "🔔",
    accentClasses: "bg-pink-500/15 text-pink-400",
  },
  {
    title: "Personalized Reports",
    description:
      "Create personalized reports for competitive analysis. Get insights that help you understand your position in the market.",
    icon: "📄",
    accentClasses: "bg-emerald-500/15 text-emerald-400",
  },
  {
    title: "AI Brand Assistant",
    description:
      "Get personalized recommendations with AI Brand Assistant. Leverage AI to get actionable insights for your brand strategy.",
    icon: "🤖",
    accentClasses: "bg-amber-500/15 text-amber-400",
  },
  {
    title: "Influencer Scoring",
    description:
      "Understand the sentiment of users with their influencer score. Identify key influencers and measure their impact on your brand.",
    icon: "👥",
    accentClasses: "bg-indigo-500/15 text-indigo-400",
  },
];

export function Features() {
  return (
    <section className="relative border-t border-senti-border bg-senti-card/10 py-20">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <H2 className="mb-3">Powerful Features</H2>
          <p className="text-lg text-senti-muted">Everything you need to understand your brand&apos;s sentiment</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
            >
              <Card className="h-full p-6 transition-colors hover:border-senti-purple/40 hover:bg-senti-card/85" hoverLift>
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-xl ${feature.accentClasses}`}>
                  <span>{feature.icon}</span>
                </div>
                <div className="mb-2 text-lg font-semibold text-[rgb(var(--senti-text))]">{feature.title}</div>
                <p className="text-sm leading-relaxed text-senti-muted">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

