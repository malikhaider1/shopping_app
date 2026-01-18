/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        surface: "#F9F9F9",
        primary: "#000000",
        text: {
          primary: "#1A1A1A",
          secondary: "#757575",
          hint: "#BDBDBD",
        },
        accent: "#FFC107",
        divider: "#E0E0E0",
        notification: "#000000",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
