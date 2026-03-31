/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#10B981",
        secondary: "#F59E0B",
        accent: "#3B82F6",
      },
      fontFamily: {
        amiri: ["Amiri", "serif"],
        tajawal: ["Tajawal", "sans-serif"],
        nunito: ["Nunito", "sans-serif"],
      }
    },
  },
  plugins: [],
}
