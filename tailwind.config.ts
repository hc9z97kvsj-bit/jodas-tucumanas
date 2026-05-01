import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 1. ACÁ VOLVEMOS A AGREGAR TUS COLORES PERSONALIZADOS
      colors: {
        night: {
          700: '#334155', // Gris oscuro (para bordes)
          800: '#1e293b', // Azul/Gris muy oscuro (para tarjetas)
          900: '#0f172a', // Fondo casi negro (para la página)
        },
        brand: {
          primary: '#f97316', // Tu naranja/rojo principal
          accent: '#fbbf24',  // Tu amarillo/dorado de acento
        }
      },
      // 2. LAS ANIMACIONES DEL BORDE DE LUZ (StarBorder)
      animation: {
        'star-movement-bottom': 'star-movement-bottom linear infinite alternate',
        'star-movement-top': 'star-movement-top linear infinite alternate',
      },
      keyframes: {
        'star-movement-bottom': {
          '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
          '100%': { transform: 'translate(-100%, 0%)', opacity: '0' },
        },
        'star-movement-top': {
          '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
          '100%': { transform: 'translate(100%, 0%)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;