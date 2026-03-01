import { motion } from "framer-motion";
import { Container } from "../layout/Container";
import { Card } from "../ui/Card";

const stats = [
  { value: "0K+", label: "Brands" },
  { value: "1+", label: "Mentions" },
  { value: "98%", label: "Accuracy" },
];

export function Stats() {
  return (
    <section className="relative py-10">
      <Container>
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.06 }}
            >
              <Card className="p-5" hoverLift>
                <div className="bg-gradient-to-r from-senti-purple to-senti-blue bg-clip-text text-2xl font-bold text-transparent">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-senti-muted">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

