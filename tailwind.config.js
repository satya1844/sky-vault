// Tailwind v4 config (ESM)
import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  plugins: [heroui()],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        quicksand: ["var(--font-quicksand)"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          100: "#e0e7ff",
          800: "#3730a3",
        },
        "primary-foreground": "var(--primary-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
    },
  },
};
