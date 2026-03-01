/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        senti: {
          // Theme-driven via CSS variables (see src/styles/theme.css)
          dark: "rgb(var(--senti-dark) / <alpha-value>)",
          card: "rgb(var(--senti-card) / <alpha-value>)",
          border: "rgb(var(--senti-border) / <alpha-value>)",
          purple: "rgb(var(--senti-primary) / <alpha-value>)",
          blue: "rgb(var(--senti-primary-2) / <alpha-value>)",
          text: "rgb(var(--senti-text) / <alpha-value>)",
          muted: "rgb(var(--senti-muted) / <alpha-value>)",
          placeholder: "rgb(var(--senti-placeholder) / <alpha-value>)",
          glow: "rgb(var(--senti-glow) / <alpha-value>)",
          green: "#22c55e",
          red: "#ef4444",
          neutral: "#6b7280",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
