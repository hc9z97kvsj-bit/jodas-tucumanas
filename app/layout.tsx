import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
// 👇 Importamos el componente del fondo interactivo
import BackgroundJoda from "@/components/BackgroundJoda";

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
    <html lang="es" className={cn("font-sans dark", geist.variable)}>
      <body 
        className={cn(
          inter.className, 
          // Eliminamos bg-night-900 para que el fondo sea transparente y deje ver la magia
          "text-white antialiased min-h-screen relative"
        )}
      >
        {/* 👇 Inyectamos el fondo detrás de todo 👇 */}
        <BackgroundJoda />

        {/* 
          Acá se inyecta directamente app/page.tsx o app/eventos/[id]/page.tsx 
          Sin header, sin nav, sin botón de admin. 100% limpio.
        */}
        {children}
      </body>
    </html>
  );
}