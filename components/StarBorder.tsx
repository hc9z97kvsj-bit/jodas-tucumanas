import React from 'react';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties['animationDuration'];
  thickness?: number;
};

const StarBorder = <T extends React.ElementType = 'div'>({
  as,
  className = '',
  color = 'white',
  speed = '6s',
  thickness = 1,
  children,
  ...rest
}: StarBorderProps<T>) => {
  // Lo forzamos a ser un 'div' por defecto para que no rompa el HTML de tus tarjetas
  const Component = as || 'div'; 

  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-2xl ${className}`}
      {...(rest as any)}
      style={{
        padding: `${thickness}px`, // El padding crea el espacio exacto para el borde brillante
        ...(rest as any).style
      }}
    >
      {/* Luz Inferior */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      ></div>
      
      {/* Luz Superior */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      ></div>
      
      {/* Contenedor Interno: Es clave el bg-night-800 acá porque actúa como "máscara" 
          para tapar el centro de la luz y que solo veamos el contorno */}
      <div className="relative z-[1] w-full h-full bg-night-800 rounded-[calc(1rem-2px)] overflow-hidden">
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;