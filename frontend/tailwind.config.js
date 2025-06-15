/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#e5e7eb",      // soft light
        secondary: "#111827",    // dark slate
        accent: "#7f1d1d",       // deep crimson
        card: "#1f2937",         // dark grey bg
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
}
