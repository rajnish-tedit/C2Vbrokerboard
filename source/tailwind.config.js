/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#D4AF37",
          50: "#FBF7E9",
          100: "#F5ECC7",
          200: "#EBD98F",
          600: "#B8952A",
          700: "#8F721F",
        },
        navy: {
          50: "#F2F5F9",
          100: "#E1E7EF",
          200: "#C5D0DE",
          300: "#9BACC4",
          400: "#6C83A5",
          500: "#4D6589",
          600: "#3B5070",
          700: "#2F405B",
          800: "#1F2B3E",
          900: "#16202E",
          950: "#0F1419",
        },
        brand: {
          DEFAULT: "#3E5C9E",
          50: "#EEF2FA",
          100: "#DDE5F4",
          200: "#C3D0EA",
          300: "#A9BCEB",
          500: "#4F6DB0",
          600: "#3E5C9E",
          700: "#324C86",
          800: "#273D6E",
          900: "#1E3A7A",
        },
        sun: {
          DEFAULT: "#FFC93C",
          50: "#FFF8E1",
          100: "#FFEFB8",
          600: "#E9B21C",
        },
        olive: "#A8913B",
        chart: {
          1: "#2a78d6",
          2: "#eb6834",
          grid: "#E5E7EB",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 20, 25, 0.04), 0 1px 3px rgba(15, 20, 25, 0.06)",
        overlay: "0 20px 50px -12px rgba(15, 20, 25, 0.35)",
      },
    },
  },
  plugins: [],
};
