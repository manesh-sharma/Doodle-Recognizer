/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pixel: {
          bg: "#FFF8EE",
          card: "#FFF2D9",
          primary: "#FFB347",
          accent: "#FF928B",
          border: "#3B2F2F",
          text: "#3B2F2F",
        },
      },

      fontFamily: {
        pixel: ['"Press Start 2P"', "cursive"],
        pixelmono: ['"VT323"', "monospace"],
        doodle: ['"Shantell Sans"', "cursive"],
      },

      borderRadius: {
        pixel: "0px",
      },

      boxShadow: {
        pixel: "4px 4px 0 #3B2F2F",
        "pixel-sm": "2px 2px 0 #3B2F2F",
        "pixel-lg": "6px 6px 0 #3B2F2F",
      },

      keyframes: {
        float: {
          "0%,100%": {
            transform: "translateY(0px) rotate(0deg)",
          },
          "50%": {
            transform: "translateY(-10px) rotate(3deg)",
          },
        },

        dash: {
          to: {
            strokeDashoffset: "0",
          },
        },
      },

      animation: {
        float: "float 4s ease-in-out infinite",
        "float-slow": "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
  
  
}

