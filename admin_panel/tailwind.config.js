/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFBFC",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#1A1A1A",
          50: "#F5F5F5",
          100: "#E8E8E8",
          200: "#D4D4D4",
          300: "#A3A3A3",
          400: "#737373",
          500: "#404040",
          600: "#2D2D2D",
          700: "#1A1A1A",
          800: "#141414",
          900: "#0A0A0A",
        },
        text: {
          primary: "#1A1A1A",
          secondary: "#737373",
          hint: "#A3A3A3",
        },
        accent: {
          DEFAULT: "#FFC107",
          light: "#FFF8E1",
        },
        success: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },
        error: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
        },
        divider: "#E5E5E5",
        notification: "#EF4444",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 0, 0, 0.08)',
        'glow-lg': '0 0 40px rgba(0, 0, 0, 0.12)',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 20px 25px -5px rgba(0,0,0,0.04)',
        'card-hover': '0 25px 50px -12px rgba(0,0,0,0.08)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-dark': 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 50%, #404040 100%)',
        'gradient-light': 'linear-gradient(135deg, #f8fafc 0%, #e5e5e5 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 0, 0, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)' },
        },
      },
    },
  },
  plugins: [],
}
