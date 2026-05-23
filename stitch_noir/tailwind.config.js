/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./features/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "rgb(var(--color-bg-primary) / <alpha-value>)",
          surface: "rgb(var(--color-bg-surface) / <alpha-value>)",
          elevated: "rgb(var(--color-bg-elevated) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
        },
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        "user-bubble": "rgb(var(--color-user-bubble) / <alpha-value>)",
        "ai-bubble": "rgb(var(--color-ai-bubble) / <alpha-value>)",
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          dim: "rgb(var(--color-surface-dim) / <alpha-value>)",
          bright: "rgb(var(--color-surface-bright) / <alpha-value>)",
          lowest: "rgb(var(--color-surface-lowest) / <alpha-value>)",
          low: "rgb(var(--color-surface-low) / <alpha-value>)",
          container: "rgb(var(--color-surface-container) / <alpha-value>)",
          high: "rgb(var(--color-surface-container-high) / <alpha-value>)",
          highest: "rgb(var(--color-surface-container-highest) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          container: "rgb(var(--color-primary-container) / <alpha-value>)",
          onContainer: "rgb(var(--color-on-primary-container) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-secondary) / <alpha-value>)",
          container: "rgb(var(--color-secondary-container) / <alpha-value>)",
          onContainer: "rgb(var(--color-on-secondary-container) / <alpha-value>)",
        },
        tertiary: {
          DEFAULT: "rgb(var(--color-tertiary) / <alpha-value>)",
          container: "rgb(var(--color-tertiary-container) / <alpha-value>)",
          onContainer: "rgb(var(--color-on-tertiary-container) / <alpha-value>)",
        },
        outline: "rgb(var(--color-outline) / <alpha-value>)",
        "outline-variant": "rgb(var(--color-outline-variant) / <alpha-value>)",
        "on-surface": "rgb(var(--color-on-surface) / <alpha-value>)",
        "on-surface-variant": "rgb(var(--color-on-surface-variant) / <alpha-value>)",
      },
      fontFamily: {
        display: ["serif"],
        inter: ["Inter"],
        "inter-semibold": ["Inter-SemiBold"],
        "inter-bold": ["Inter-Bold"],
      },
      borderRadius: {
        sm: 4,
        DEFAULT: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
      },
      spacing: {
        unit: 4,
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 40,
        "margin-mobile": 20,
      }
    },
  },
  plugins: [],
};
