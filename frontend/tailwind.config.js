/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#EFECE4', // Deepest recessed input/bars
          900: '#F5F2EB', // Primary off-white canvas background
          850: '#F0ECE4', // Subtle row hover
          800: '#FFFFFF', // Card surface 1 (crisp white card)
          750: '#FAF8F5',
          700: '#F6F3ED', // Card surface 2 (elevated)
          600: '#D5CDBE', // Accent border
          500: '#B8AF9E',
        },
        ivory: {
          50: '#11110E',
          100: '#1F1E1A',
          200: '#1F1E1A', // Main text: blackish brown!
          300: '#3D3832',
          400: '#524B43',
        },
        sage: {
          300: '#3D3832',
          400: '#524B43',
          500: '#736E60', // Sage accent / secondary lines
          600: '#5C584C',
          700: '#474338',
          muted: '#6B6659', // Muted blackish-brown secondary text!
        },
        brass: {
          300: '#8C6830',
          400: '#9E7C4B',
          500: '#9E7C4B', // Antique brass accent
          600: '#806338',
          700: '#664E29',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      animation: {
        'shimmer-brass': 'shimmerBrass 3s linear infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'flow-particle': 'flowParticle 2.5s linear infinite',
      },
      keyframes: {
        shimmerBrass: {
          'from': { backgroundPosition: '0 0' },
          'to': { backgroundPosition: '-200% 0' }
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.85' }
        },
        flowParticle: {
          '0%': { transform: 'translateX(0)', opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' }
        }
      }
    },
  },
  plugins: [],
}
