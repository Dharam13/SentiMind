import { motion } from "framer-motion";
import { Container } from "../layout/Container";
import { LiveSentimentChart } from "../charts/LiveSentimentChart";

export function DashboardPreview() {
  return (
    <section className="relative py-16">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-senti-muted">Preview</div>
          <div className="mt-2 text-2xl font-bold text-[rgb(var(--senti-text))]">Live sentiment at a glance</div>
          <p className="mt-2 text-senti-muted">
            A quick look at how Sentimind visualizes brand sentiment trends in real time.
          </p>
        </motion.div>
        <LiveSentimentChart />
      </Container>
    </section>
  );
}

