import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Jodas Tucumanas | Cartelera',
  description: 'Descubrí los mejores bailes, recitales y fiestas en Tucumán.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-night-900 text-white antialiased min-h-screen`}>
        {/* 
          Acá se inyecta directamente app/page.tsx o app/eventos/[id]/page.tsx 
          Sin header, sin nav, sin botón de admin. 100% limpio.
        */}
        {children}
      </body>
    </html>
  );
}