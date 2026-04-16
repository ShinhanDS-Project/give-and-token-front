export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FF8A65",
        secondary: "#9575CD",
        accent: "#FFF176",
        surface: "#FFF9F5",
        ink: "#4E342E",
        line: "#FBE9E7"
      },
      fontFamily: {
        sans: ['"Quicksand"', '"Noto Sans KR"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Fraunces"', '"Gaegu"', "serif"],
        hand: ['"Gaegu"', "cursive"]
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};
