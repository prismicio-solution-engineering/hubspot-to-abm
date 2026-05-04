import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "slide-out-left": {
          from: { opacity: "1", transform: "translateX(0)" },
          to:   { opacity: "0", transform: "translateX(-20px)" },
        },
        "slide-out-right": {
          from: { opacity: "1", transform: "translateX(0)" },
          to:   { opacity: "0", transform: "translateX(20px)" },
        },
        "dialog-overlay-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "dialog-overlay-out": {
          from: { opacity: "1" },
          to:   { opacity: "0" },
        },
        "dialog-content-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.97)" },
          to:   { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "dialog-content-out": {
          from: { opacity: "1", transform: "translateY(0) scale(1)" },
          to:   { opacity: "0", transform: "translateY(4px) scale(0.98)" },
        },
        "page-rise": {
          "0%":   { opacity: "0", transform: "var(--bt) translateY(32px)" },
          "18%":  { opacity: "1", transform: "var(--bt) translateY(0)" },
          "72%":  { opacity: "1", transform: "var(--bt) translateY(0)" },
          "88%":  { opacity: "0", transform: "var(--bt) translateY(0)" },
          "100%": { opacity: "0", transform: "var(--bt) translateY(32px)" },
        },
      },
      animation: {
        "slide-in-right":     "slide-in-right     280ms cubic-bezier(0.4,0,0.2,1) both",
        "slide-in-left":      "slide-in-left      280ms cubic-bezier(0.4,0,0.2,1) both",
        "slide-out-left":     "slide-out-left     160ms cubic-bezier(0.4,0,0.2,1) both",
        "slide-out-right":    "slide-out-right    160ms cubic-bezier(0.4,0,0.2,1) both",
        "dialog-overlay-in":  "dialog-overlay-in  180ms ease both",
        "dialog-overlay-out": "dialog-overlay-out 150ms ease both",
        "dialog-content-in":  "dialog-content-in  200ms cubic-bezier(0.16,1,0.3,1) both",
        "dialog-content-out": "dialog-content-out 150ms ease both",
        "page-rise":          "page-rise 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
