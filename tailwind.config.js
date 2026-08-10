/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        xs: '390px',
      },
      colors: {
        kada: {
          ink: '#1a0f0a',
          bean: '#2a1a10',
          decoction: '#3d2415',
          milk: '#e9d5b0',
          glass: '#c89060',
          amber: '#d4a056',
          ember: '#e07b3a',
          steam: 'rgba(233,213,176,0.35)',
        },
      },
      fontFamily: {
        ml: ['"Noto Sans Malayalam"', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        rainFall: {
          '0%': { transform: 'translateY(-10vh) translateX(0)', opacity: '0' },
          '20%': { opacity: '0.6' },
          '100%': { transform: 'translateY(110vh) translateX(-10px)', opacity: '0' },
        },
        steamRise: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '0' },
          '30%': { opacity: '0.4' },
          '100%': { transform: 'translateY(-60px) scale(1.6)', opacity: '0' },
        },
        flickerIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'rain-fall': 'rainFall 0.8s linear infinite',
        'steam-rise': 'steamRise 3s ease-out infinite',
        'flicker-in': 'flickerIn 2s ease-out forwards',
      },
    },
  },
  plugins: [],
}
