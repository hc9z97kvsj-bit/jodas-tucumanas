import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

// Configuración de fuentes
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans'
});

const inter = Inter({ 
  subsets: ['latin'] 
});

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
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body 
        className={cn(
          inter.className, 
          "bg-night-900 text-white antialiased min-h-screen"
        )}
      >
        {/* 
          Acá se inyecta directamente app/page.tsx o app/eventos/[id]/page.tsx 
          Sin header, sin nav, sin botón de admin. 100% limpio.
        */}
        {children}
      </body>
    </html>
  );
}