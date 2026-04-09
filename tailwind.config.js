/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'solid-blue': '#0B2265',
        'solid-green': '#3FAE5A',
        'solid-green-hover': '#2E9449',
        'solid-green-light': '#BDEDC5',
        'solid-steel': '#2B2B2B',
        'solid-concrete': '#F4F6F7',
      },
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
