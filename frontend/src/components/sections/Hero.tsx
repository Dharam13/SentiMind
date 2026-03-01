import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { AnimatedText } from "../common/AnimatedText";
import { Container } from "../layout/Container";

export function Hero() {
  return (
    <section className="relative z-10 pb-24">
      {/* Logo-zone spacer: gives the fixed logo full viewport height before hero text appears */}
      <div className="h-screen w-full" aria-hidden="true" />
      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="mb-6 border-transparent bg-senti-purple/15 text-senti-muted">
              <span className="text-base">⚡</span>
              AI-Powered Sentiment Intelligence
            </Badge>
          </motion.div>

          <div className="mb-4">
            <AnimatedText
              text="Sentimind"
              className="bg-gradient-to-r from-senti-blue via-senti-purple to-fuchsia-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl md:text-7xl"
            />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mb-3 text-xl font-medium text-[rgb(var(--senti-text))] sm:text-2xl"
          >
            The one-stop shop for your brand insights.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10 text-base text-senti-muted sm:text-lg"
          >
            Track mentions, analyze sentiment, and gain actionable insights across news, social media, and blogs—all in real-time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/signup">
              <Button size="lg">
                Get Started <span className="text-lg">→</span>
              </Button>
            </Link>
            <Button size="lg" variant="outline" type="button">
              Watch Demo
            </Button>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

