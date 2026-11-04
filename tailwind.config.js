/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B0E14',
          900: '#0B0E14',
          850: '#0E121A',
          800: '#121722',
        },
        card: {
          DEFAULT: '#151B26',
          2: '#181F2C',
          3: '#1E2636',
          4: '#252E40',
        },
        line: 'rgba(255,255,255,0.06)',
        accent: {
          DEFAULT: '#8AB4F8',
          soft: '#9BBBF4',
          deep: '#5B7DB8',
        },
        streak: {
          DEFAULT: '#F39C12',
          soft: '#F2A65A',
          bg: '#3A2A1C',
        },
        mute: {
          DEFAULT: '#8B93A7',
          2: '#5D6578',
          3: '#3A4253',
        },
        star: '#F6C445',
        ok: '#34C77B',
      },
      fontFamily: {
        serif: ['Newsreader', 'Lora', 'Georgia', 'serif'],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        glass: '0 10px 40px -10px rgba(0,0,0,0.6)',
        glow: '0 0 0 1.5px rgba(138,180,248,0.85), 0 0 18px rgba(138,180,248,0.35)',
      },
      keyframes: {
        twinkle: {
          '0%,100%': { opacity: '0.25', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        breathe: {
          '0%,100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.035)' },
        },
        floatz: {
          '0%': { opacity: '0', transform: 'translate(0,0) scale(0.7)' },
          '30%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translate(8px,-18px) scale(1.1)' },
        },
        pageflip: {
          '0%,70%,100%': { transform: 'rotateY(0deg)' },
          '80%': { transform: 'rotateY(-150deg)' },
        },
        pulseDot: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        twinkle: 'twinkle 2.6s ease-in-out infinite',
        breathe: 'breathe 3.2s ease-in-out infinite',
        floatz: 'floatz 3s ease-out infinite',
        pageflip: 'pageflip 5s ease-in-out infinite',
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}
