/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 3s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
  safelist: [
    // Amber colors
    'bg-amber-500',
    'bg-amber-600',
    'from-amber-500',
    'to-amber-600',
    'from-amber-300',
    'to-amber-400',
    'text-amber-300',
    'text-amber-400',
    'border-amber-500/50',
    'hover:border-amber-500',
    'bg-amber-500/20',
    'bg-amber-900/20',
    // Orange colors
    'bg-orange-500',
    'bg-orange-600',
    'from-orange-300',
    'to-orange-400',
    'to-orange-600',
    'to-orange-700',
    'text-orange-300',
    // Red colors
    'to-red-300',
    // Emerald colors
    'from-emerald-500',
    'to-emerald-600',
    'to-teal-600',
    // Cyan colors
    'from-cyan-500',
    'to-cyan-600',
    'to-blue-600',
    // Slate colors
    'bg-slate-950',
    'bg-slate-900',
    'via-slate-900',
    'bg-slate-800/50',
    'border-slate-700/50',
    'border-slate-600',
    'text-slate-300',
    'text-slate-400',
    'bg-orange-900/20',
  ],
};