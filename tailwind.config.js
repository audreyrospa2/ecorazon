/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'forest-green': '#4B6F44',
        'deep-olive': '#3C5534',
        'warm-beige': '#F9F6F1',
        'cork-brown': '#A67C52',
        'neutral-white': '#FFFFFF',
        'leaf-green': '#7A9E62'
      },
      fontFamily: {
      title: ['Playfair Display', 'serif'],
      body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}