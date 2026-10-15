import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        ardana: {
          burgundy: "#641E32",
          maroon: "#812D46",
          dusty: "#C98F9D",
          blush: "#F5E8EB",
          white: "#FFFCFA",
          softgray: "#F3F1F2",
          charcoal: "#30272A",
          muted: "#82777B",
        },
        brand: {
          50: "#FAF5F6",
          100: "#F5E8EB", // Soft Blush
          200: "#EAD1D6",
          300: "#D9B2BC",
          400: "#C98F9D", // Dusty Rose
          500: "#812D46", // Maroon
          600: "#641E32", // Deep Burgundy
          700: "#521626",
          800: "#3F0E1B",
          900: "#30272A", // Dark Charcoal
          950: "#1D070D",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#812D46",
          foreground: "#FFFCFA",
        },
        secondary: {
          DEFAULT: "#F3F1F2",
          foreground: "#30272A",
        },
        muted: {
          DEFAULT: "#F3F1F2",
          foreground: "#82777B",
        },
        accent: {
          DEFAULT: "#F5E8EB",
          foreground: "#641E32",
        },
        destructive: {
          DEFAULT: "#be123c",
          foreground: "#FFFCFA",
        },
        border: "#F3F1F2",
        input: "#F3F1F2",
        ring: "#812D46",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slide-down 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
