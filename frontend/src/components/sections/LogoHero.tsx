import { motion, useScroll, useTransform, useMotionTemplate } from "framer-motion";
import logo from "@/assets/images/sentimind-logo.png";

export function LogoHero() {
  const { scrollY } = useScroll();

  // SCALE (smooth cinematic timing)
  const scale = useTransform(scrollY, [0, 350], [2, 0.42]);

  // MOVE UP
  const y = useTransform(scrollY, [0, 350], [0, -315]);

  // MOVE LEFT into navbar
  const x = useTransform(scrollY, [350, 700], [0, -520]);

  // OPACITY
  const opacity = useTransform(scrollY, [0, 350], [1, 1]);

  // BLUR while shrinking
  const blur = useTransform(scrollY, [0, 350], ["0px", "2px"]);

  // GLOW intensity (used to modulate shadow softness)
  const glow = useTransform(scrollY, [0, 350], [0.8, 0.3]);
  const filter = useMotionTemplate`blur(${blur}) drop-shadow(0 0 ${glow}px rgba(124,92,255,0.4))`;

  // Background Contrast Glow Opacity (fades out as it shrinks into navbar)
  const contrastGlowOpacity = useTransform(scrollY, [0, 200], [0.4, 0]);

  return (
    // Wrapper handles centering via flexbox — no CSS transform conflict with Framer Motion
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <motion.div
        style={{ scale, x, y, opacity, willChange: "transform, opacity" }}
        className="relative flex items-center justify-center"
      >
        {/* Contrast Glow (Improves readability of white text in Light Mode) */}
        <motion.div
          style={{ opacity: contrastGlowOpacity }}
          className="absolute inset-x-[-10%] inset-y-[-20%] z-0 rounded-full bg-senti-purple/50 blur-[80px]"
        />

        {/* Floating Animation + Filters mapped to image */}
        <motion.img
          src={logo}
          alt="Sentimind Logo"
          animate={{ y: ["-1.5%", "1.5%", "-1.5%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{ filter, willChange: "transform, filter" }}
          className="relative z-10 w-[540px] md:w-[690px] drop-shadow-[0_0_40px_rgba(124,92,255,0.4)]"
        />
      </motion.div>
    </div>
  );
}

