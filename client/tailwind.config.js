/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // SplitEasy purple identity
        plum: "#2D1B4E", // deep background accents
        amethyst: "#7C4DFF", // primary actions
        violet: "#5B21B6", // secondary / hover states
        lavender: "#F3EEFF", // light surfaces
        ink: "#1E1B2E", // near-black text
        owed: "#22C55E", // "you are owed" green
        owe: "#F97066", // "you owe" coral
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
