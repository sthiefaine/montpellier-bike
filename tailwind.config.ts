import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        dash: {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-1000' },
        },
        bike: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(20px, 0) rotate(0deg)' },
          '50%': { transform: 'translate(20px, 20px) rotate(90deg)' },
          '75%': { transform: 'translate(0, 20px) rotate(180deg)' },
          '100%': { transform: 'translate(0, 0) rotate(270deg)' },
        }
      },
      animation: {
        'dash': 'dash 30s linear infinite',
        'bike': 'bike 10s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
