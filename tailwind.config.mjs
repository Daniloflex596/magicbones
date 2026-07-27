/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        night: {
          bg: 'var(--bg-night)',
          deep: 'var(--night-deep)',
        },
        amanita: {
          red: 'var(--amanita-red)',
          glow: 'var(--amanita-glow)',
        },
        mushroom: {
          violet: 'var(--mushroom-violet)',
        },
        moss: {
          green: 'var(--moss-green)',
        },
        turquoise: 'var(--turquoise)',
        bone: {
          cream: 'var(--bone-cream)',
        },
        bordeaux: 'var(--bordeaux)',
        paper: {
          warm: 'var(--paper-warm)',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['Jost', 'sans-serif'],
        flash: ['"Pirata One"', 'cursive'],
      },
    },
  },
  plugins: [],
};
