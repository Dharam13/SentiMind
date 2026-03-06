/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: "hsl(var(--card) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        "muted-foreground": "hsl(var(--muted-foreground) / <alpha-value>)",
        primary: "hsl(var(--primary) / <alpha-value>)",
        "primary-foreground": "hsl(var(--primary-foreground) / <alpha-value>)",
        "stat-blue": "hsl(var(--stat-blue) / <alpha-value>)",
        "stat-green": "hsl(var(--stat-green) / <alpha-value>)",
        "stat-purple": "hsl(var(--stat-purple) / <alpha-value>)",
        "stat-orange": "hsl(var(--stat-orange) / <alpha-value>)",
        "stat-red": "hsl(var(--stat-red) / <alpha-value>)",
        senti: {
          dark: "#0f0f1a",
          card: "#1a1a2e",
          border: "#2a2a4a",
          purple: "#8b5cf6",
          blue: "#3b82f6",
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
