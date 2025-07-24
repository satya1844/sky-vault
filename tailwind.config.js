// tailwind.config.js
const {heroui} = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */


const config = {
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        card: "rgb(var(--card))",
        "card-foreground": "rgb(var(--card-foreground))",
        primary: "rgb(var(--primary))",
        "primary-foreground": "rgb(var(--primary-foreground))",
        border: "rgb(var(--border))",
        input: "rgb(var(--input))",
        muted: "rgb(var(--muted))",
        "muted-foreground": "rgb(var(--muted-foreground))",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
    },
  },
};

module.exports = {
  darkMode: false,
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/components/(card|ripple).js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        quicksand: ["var(--font-quicksand)"],
      },
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          // Add other shades if needed
          100: "#e0e7ff", // Example - adjust to match your design
          800: "#3730a3", // Example - adjust to match your design
        },
        // Add other color definitions as needed
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};

export default config;
