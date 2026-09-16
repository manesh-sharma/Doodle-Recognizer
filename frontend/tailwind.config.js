/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        doodle: {
          dark: '#1e293b',
          canvas: '#fafafa',
          accent: '#4f46e5',
          warm: '#f59e0b',
        }
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(3deg)' },
        },
        dash: {
          to: {
            'stroke-dashoffset': '0',
          }
        }
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
