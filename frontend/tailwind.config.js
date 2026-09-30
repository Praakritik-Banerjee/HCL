/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#1a1410",
        surface: "#221c16",
        surfaceHover: "#2d251d",
        border: "#3a3028",
        primary: {
          50: "#fdf8f0",
          100: "#f9edd8",
          200: "#f2d9b0",
          300: "#e8c07e",
          400: "#dda554",
          500: "#c98b3a",
          600: "#b07430",
          700: "#925b28",
          800: "#784a25",
          900: "#5e3a20",
          950: "#3d2412",
        },
        accent: {
          cyan: "#7ec8a4",
          emerald: "#7ec8a4",
          amber: "#dda554",
          rose: "#c47a6c",
          purple: "#a68bb5",
        },
        warm: {
          50: "#faf7f2",
          100: "#f0e8da",
          200: "#e0d1b7",
          300: "#c9b28d",
          400: "#b39468",
          500: "#9e7b50",
          600: "#866542",
          700: "#6b4f36",
          800: "#5a4130",
          900: "#4d382a",
          950: "#2b1d15",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "sans-serif"],
        display: ["'Outfit'", "'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "fade-up": "fadeUp 0.7s ease-out forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-right": "slideRight 0.7s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
