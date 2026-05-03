import React from 'react';

export default function BackgroundJoda() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-night-900">
      
      {/* CAPA 1: FOTO DE BOLICHE (Oscurecida y en blanco y negro) */}
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-luminosity"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* CAPA 2: DEGRADADO PARA QUE SE PUEDA LEER EL TEXTO */}
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/40 via-night-900/80 to-night-900"></div>

      {/* CAPA 3: LUCES DE NEÓN MOVIÉNDOSE (Transiciones) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-primary/20 blur-[120px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/15 blur-[120px] animate-blob" style={{ animationDelay: '5s' }}></div>

      {/* CAPA 4: EFECTO GLITCH / RUIDO DE CÁMARA */}
      <div
        className="absolute -inset-[100%] opacity-[0.05] animate-glitch-noise pointer-events-none"
        style={{
          // Este es un truco avanzado: un SVG de ruido generado en código, sin tener que descargar imágenes.
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'
        }}
      ></div>
      
    </div>
  );
}