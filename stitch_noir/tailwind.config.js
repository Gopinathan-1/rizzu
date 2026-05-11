/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./features/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#080808",
        surface: {
          DEFAULT: "#121212",
          dim: "#080808",
          bright: "#3c3742",
          lowest: "#0a0a0a",
          low: "#121212",
          container: "#1c1c1c",
          high: "#262626",
          highest: "#333333",
        },
        primary: {
          DEFAULT: "#d3bbff",
          container: "#6d28d9",
          onContainer: "#dac5ff",
        },
        secondary: {
          DEFAULT: "#adc6ff",
          container: "#0566d9",
          onContainer: "#e6ecff",
        },
        tertiary: {
          DEFAULT: "#ffb2b7",
          container: "#b20035",
          onContainer: "#ffbec1",
        },
        outline: "#958da1",
        "outline-variant": "#262626",
        "on-surface": "#f5f5f5",
        "on-surface-variant": "#958da1",
      },
      fontFamily: {
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
