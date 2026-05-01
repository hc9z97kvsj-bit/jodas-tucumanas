"use client";

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Heart, Music } from 'lucide-react';

interface EventProps {
  id: string;
  title: string;
  venue?: string;
  imageUrl: string;
  location: string;
  date: string;
  musicType: string;
  rating?: number; 
  likes?: number;  
  mediaType?: string; 
  // Ya no necesitamos el telefono acá, la tarjeta queda más limpia
}

function formatearFecha(fechaStr: string) {
  if (!fechaStr || !fechaStr.includes('-')) return fechaStr;
  try {
    const [fechaLocal, hora] = fechaStr.split('T');
    const [year, month, day] = fechaLocal.split('-');
    const fecha = new Date(Number(year), Number(month) - 1, Number(day));
    
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const nombreDia = dias[fecha.getDay()];
    const numeroDia = String(fecha.getDate()).padStart(2, '0');
    const nombreMes = meses[fecha.getMonth()];

    let resultado = `${nombreDia} ${numeroDia} de ${nombreMes}`;
    if (hora) resultado += ` a las ${hora}hs`;

    return resultado;
  } catch (error) {
    return fechaStr;
  }
}

export default function EventCard({ 
  id, 
  title, 
  venue, 
  imageUrl, 
  location, 
  date, 
  musicType, 
  rating, 
  likes, 
  mediaType = 'image'
}: EventProps) {
  
  const fechaFormateada = formatearFecha(date);
  const likesIniciales = likes !== undefined ? likes : (rating || 0);

  // Estado local para que el botón "Me gusta" reaccione al toque
  const [isLiked, setIsLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likesIniciales);

  // Función visual del Me Gusta (después podés conectarla a Firebase)
  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Evita que el click haga algo raro si lo envolvemos en un Link
    if (isLiked) {
      setCurrentLikes(prev => prev - 1);
      setIsLiked(false);
    } else {
      setCurrentLikes(prev => prev + 1);
      setIsLiked(true);
    }
    // ACÁ A FUTURO: Lógica para guardar el like en la base de datos
  };

  return (
    <div className="group bg-night-800 rounded-2xl overflow-hidden border border-night-700 transition-all duration-300 hover:shadow-glow hover:-translate-y-1.5 flex flex-col h-full shadow-lg">
      
      {/* 1. SECCIÓN SUPERIOR: Imagen o Video Automático */}
      <div className="relative h-56 w-full bg-night-900 overflow-hidden">
        
        {mediaType === 'video' ? (
          <video 
            src={imageUrl} 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105 pointer-events-none"
          />
        ) : (
          <img 
            src={imageUrl} 
            alt={title} 
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
          />
        )}

        {/* Solo dejamos la etiqueta flotante de la Música, queda mucho más limpio */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1.5 bg-brand-primary/95 px-3 py-1.5 rounded-lg text-xs font-bold text-white uppercase tracking-wider border border-brand-primary/50 shadow-md backdrop-blur-sm">
            <Music size={14} />
            <span>{musicType}</span>
          </div>
        </div>
      </div>
      
      {/* 2. SECCIÓN INFERIOR: Información del evento */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between bg-night-800">
        
        <div className="mb-5">
          <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-1.5 line-clamp-1" title={title}>
            {title}
          </h3>
          {venue && (
            <p className="text-brand-primary font-medium text-sm uppercase tracking-wide flex items-center gap-1.5">
               {venue}
            </p>
          )}
        </div>
        
        <div className="space-y-2.5 mb-6">
          <div className="flex items-center gap-3 text-gray-300 text-sm">
            <div className="bg-night-900 p-1.5 rounded-md border border-night-700">
              <Calendar size={16} className="text-brand-accent flex-shrink-0" />
            </div>
            <span className="capitalize font-medium">{fechaFormateada}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300 text-sm">
            <div className="bg-night-900 p-1.5 rounded-md border border-night-700">
              <MapPin size={16} className="text-brand-accent flex-shrink-0" />
            </div>
            <span className="font-medium line-clamp-1" title={location}>{location}</span>
          </div>
        </div>

        {/* BOTONERA ESTRATÉGICA: Me Gusta + Detalles */}
        <div className="flex gap-3 mt-auto">
          
          {/* Botón interactivo de Me Gusta */}
          <button 
            onClick={handleLikeClick}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all duration-300 border shadow-sm ${
              isLiked 
              ? 'bg-red-500/10 border-red-500/50 text-red-500 scale-[1.02]' 
              : 'bg-night-900 border-night-700 text-gray-400 hover:border-red-500/30 hover:text-red-400'
            }`}
            title="Me gusta"
          >
            <Heart size={20} className={isLiked ? 'fill-current animate-pulse' : ''} />
            <span className="text-sm">{currentLikes}</span>
          </button>

          {/* Botón principal de llamada a la acción */}
          <Link 
            href={`/eventos/${id}`}
            className="flex-1 flex items-center justify-center bg-brand-primary hover:brightness-110 text-white py-3 rounded-xl font-semibold transition-all duration-300 border border-transparent shadow-sm hover:scale-[1.02]"
          >
            Ver más detalles
          </Link>
        </div>

      </div>
    </div>
  );
}