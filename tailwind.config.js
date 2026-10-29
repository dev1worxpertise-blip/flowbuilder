/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        worx: {
          red: "#c00000",       // Primary Deep Brand Red
          coral: "#ff4040",     // Vibrant Accent Red / Coral
          rose: "#ffbfbf",      // Soft Rose / Tint
          slate: "#858591",     // Slate Neutral Grey
          silver: "#c0c0c8",    // Cool Light Grey
          dark: "#0a0d15",      // Dark Canvas
          surface: "#0d111a",   // Surface
          card: "#151b27",      // Card Background
          border: "#232c3d",    // Container Borders
        },
      },
      fontFamily: {
        sans: ['"Montserrat"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
