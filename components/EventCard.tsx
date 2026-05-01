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
  rating?: number; // Mantenemos esto por compatibilidad con eventos cargados antes
  likes?: number;  // Nuevo contador de corazones
  mediaType?: string; // Para saber si es 'image' o 'video'
}

// Función para traducir el formato técnico del calendario a texto legible
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
  
  // Si el evento es nuevo usa "likes", si es viejo usa "rating", si no tiene ninguno usa 0
  const likesCount = likes !== undefined ? likes : (rating || 0);

  return (
    <div className="group bg-night-800 rounded-2xl overflow-hidden border border-night-700 transition-all duration-300 hover:shadow-glow hover:-translate-y-1.5 flex flex-col h-full shadow-lg">
      
      {/* 1. SECCIÓN SUPERIOR: Imagen o Video Automático */}
      <div className="relative h-56 w-full bg-night-900 overflow-hidden">
        
        {/* LÓGICA MULTIMEDIA: Elige qué renderizar */}
        {mediaType === 'video' ? (
          <video 
            src={imageUrl} 
            autoPlay 
            loop 
            muted 
            playsInline // Fundamental para que en iPhone no se abra en pantalla completa solo
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105 pointer-events-none"
          />
        ) : (
          <img 
            src={imageUrl} 
            alt={title} 
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
          />
        )}
        
        {/* Etiquetas Flotantes */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 bg-night-900/95 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-night-700 shadow-md backdrop-blur-sm transition-transform hover:scale-105">
            <Heart size={14} className="fill-current" />
            <span>{likesCount}</span>
          </div>
        </div>

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
        
        {/* Detalles (Fecha y Lugar) con íconos encapsulados */}
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

        {/* Botón de acción */}
        <Link 
          href={`/eventos/${id}`}
          className="w-full flex items-center justify-center bg-night-900 hover:bg-brand-primary text-white py-3 rounded-xl font-semibold transition-all duration-300 border border-night-700 hover:border-brand-primary shadow-sm mt-auto"
        >
          Ver más detalles
        </Link>

      </div>
    </div>
  );
}