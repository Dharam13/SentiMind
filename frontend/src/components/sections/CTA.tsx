import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Container } from "../layout/Container";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

export function CTA() {
  return (
    <section className="relative py-16">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden p-8">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-senti-purple/20 blur-3xl" />
            <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-senti-blue/15 blur-3xl" />
            <div className="relative">
              <div className="text-2xl font-bold text-[rgb(var(--senti-text))]">Ready to track your brand?</div>
              <p className="mt-2 max-w-2xl text-senti-muted">
                Create your first project and start collecting mentions across platforms in minutes.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/signup">
                  <Button size="lg">
                    Create account <span className="text-lg">→</span>
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </Container>
    </section>
  );
}

