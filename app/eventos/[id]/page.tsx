'use client';

import { useEffect, useState, use } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Music, Loader2, X, ZoomIn, PlayCircle, Heart, Building, Share2, Check, PhoneOff, MessageCircle } from 'lucide-react';
import StarBorder from '@/components/StarBorder';

interface EventData {
  id: string;
  title: string;
  venue?: string;
  locality?: string;
  imageUrl: string;
  location: string;
  date: string;
  musicType: string;
  phone: string;
  description: string;
  rating?: number;
  likes?: number;
  mediaType?: string;
}

function formatearFecha(fechaStr: string) {
  if (!fechaStr || !fechaStr.includes('-')) return fechaStr;
  try {
    const [fechaLocal, hora] = fechaStr.split('T');
    const [year, month, day] = fechaLocal.split('-');
    const fecha = new Date(Number(year), Number(month) - 1, Number(day));
    
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    let resultado = `${dias[fecha.getDay()]} ${String(fecha.getDate()).padStart(2, '0')} de ${meses[fecha.getMonth()]}`;
    if (hora) resultado += ` a las ${hora} hs`;

    return resultado;
  } catch (error) {
    return fechaStr;
  }
}

export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'eventos', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data(); 
          const eventDataCompleto = { id: docSnap.id, ...data } as EventData;
          
          setEvent(eventDataCompleto);
          
          // Fix matemático para asegurar que siempre cargue un número
          setLikesCount(Number(eventDataCompleto.likes || 0));
          
          if (localStorage.getItem(`liked_${id}`)) {
            setHasLiked(true);
          }
        }
      } catch (error) {
        console.error("Error al obtener el evento:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleLike = async () => {
    if (hasLiked || isLiking) return; 
    
    setIsLiking(true);
    try {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
      localStorage.setItem(`liked_${id}`, 'true');
      
      const eventRef = doc(db, 'eventos', id);
      await updateDoc(eventRef, {
        likes: increment(1)
      });
    } catch (error) {
      console.error("Error al dar like", error);
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
      localStorage.removeItem(`liked_${id}`);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;

    // Compartir nativo: Si es móvil abre WhatsApp/Instagram, si es PC copia link
    const shareData = {
      title: event.title,
      text: `¡Mirá esta joda en Tucumán! 🔥 ${event.title} en ${event.venue || event.location}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Compartir cancelado');
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500); 
      } catch (err) {
        console.error("Error copiando el texto", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-brand-primary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="text-gray-400">Cargando detalles de la joda...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
        <h2 className="text-2xl font-bold mb-4">Evento no encontrado</h2>
        <Link href="/" className="text-brand-primary hover:underline flex items-center gap-2 bg-night-800 px-6 py-3 rounded-xl border border-night-700">
          <ArrowLeft size={20} /> Volver a la cartelera
        </Link>
      </div>
    );
  }

  const isVideo = event.mediaType === 'video';
  const hasPhone = event.phone && event.phone.trim() !== '';
  const cleanPhone = hasPhone ? event.phone.replace(/\D/g, '') : '';
  const whatsappMessage = `Hola! Vengo de Jodas Tucumanas. Quiero info del evento: *${event.title}*`;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <>
      <main className="min-h-screen text-white pb-20">
        
        {/* BOTÓN FLOTANTE: Volver */}
        <Link 
          href="/" 
          className="absolute top-6 left-4 sm:left-8 z-50 bg-black/50 backdrop-blur-md p-3 rounded-full text-white hover:bg-brand-primary hover:scale-105 transition-all border border-white/10 shadow-lg"
        >
          <ArrowLeft size={24} />
        </Link>

        {/* 1. HEADER INMERSIVO */}
        <div 
          className="relative w-full h-80 sm:h-96 lg:h-[450px] cursor-pointer group" 
          onClick={() => setIsImageModalOpen(true)}
        >
          {isVideo ? (
            <video 
              src={event.imageUrl} 
              autoPlay loop muted playsInline
              className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80 pointer-events-none"
            />
          ) : (
            <img 
              src={event.imageUrl} 
              alt={event.title} 
              className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-night-900 via-night-900/40 to-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <div className="bg-black/60 backdrop-blur-sm p-4 rounded-full text-white scale-90 group-hover:scale-100 transition-transform">
              {isVideo ? <PlayCircle size={48} /> : <ZoomIn size={40} />}
            </div>
          </div>
        </div>

        {/* 2. CONTENEDOR PRINCIPAL */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 -mt-24 sm:-mt-32">
          
          <div className="flex justify-between items-end mb-4">
            <div className="bg-brand-primary px-4 py-1.5 rounded-xl font-bold text-sm tracking-wider uppercase shadow-lg text-white flex items-center gap-2">
              <Music size={16} />
              {event.musicType}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleShare}
                className="bg-night-800/80 backdrop-blur-md p-3 rounded-full border border-night-700 hover:bg-night-700 transition-colors text-white shadow-lg"
              >
                {isCopied ? <Check size={20} className="text-green-400" /> : <Share2 size={20} />}
              </button>
              
              <button 
                onClick={handleLike}
                disabled={hasLiked || isLiking}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold border transition-all shadow-lg backdrop-blur-md ${
                  hasLiked 
                  ? 'bg-red-500/20 border-red-500/50 text-red-500' 
                  : 'bg-night-800/80 border-night-700 text-gray-300 hover:text-red-400'
                }`}
              >
                <Heart size={20} className={hasLiked ? 'fill-current animate-pulse' : ''} />
                <span>{likesCount}</span>
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-2 drop-shadow-lg">
              {event.title}
            </h1>
            {event.venue && (
              <h2 className="text-xl sm:text-2xl text-brand-primary font-semibold flex items-center gap-2">
                <Building size={24} className="shrink-0" /> {event.venue}
              </h2>
            )}
          </div>

          {/* 3. INFO MODULAR */}
          <div className="bg-night-800 border border-night-700 rounded-3xl p-2 mb-8 shadow-xl">
            <div className="flex items-center gap-4 p-4 hover:bg-night-700/50 rounded-2xl transition-colors">
              <div className="bg-night-900 p-3.5 rounded-xl text-brand-accent shadow-inner border border-night-700/50">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400 mb-0.5">Fecha y Hora</p>
                <p className="font-semibold text-white text-lg capitalize">{formatearFecha(event.date)}</p>
              </div>
            </div>
            <div className="h-px bg-night-700 mx-4"></div>
            <div className="flex items-center gap-4 p-4 hover:bg-night-700/50 rounded-2xl transition-colors">
              <div className="bg-night-900 p-3.5 rounded-xl text-green-400 shadow-inner border border-night-700/50">
                <MapPin size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400 mb-0.5">Ubicación</p>
                <p className="font-semibold text-white">{event.location}</p>
                {event.locality && event.locality !== 'Interior / Otra' && (
                  <p className="text-sm text-gray-500">{event.locality}</p>
                )}
              </div>
            </div>
          </div>

          {/* 4. WHATSAPP CON STARBORDER */}
          <div className="mb-10 w-full">
            {!hasPhone ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-night-800 text-gray-500 rounded-2xl cursor-not-allowed border border-night-700"
              >
                <PhoneOff size={24} />
                <span className="text-lg font-bold tracking-wide">Sin número de contacto</span>
              </button>
            ) : (
              <StarBorder
                as="a"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full shadow-xl shadow-[#25D366]/10"
                color="#25D366" 
                speed="4s"      
                thickness={2}   
              >
                <div className="flex items-center justify-center gap-3 px-6 py-4 text-white">
                  <MessageCircle size={24} className="text-[#25D366]" />
                  <span className="text-lg font-bold tracking-wide">Consultar Reservas</span>
                </div>
              </StarBorder>
            )}
          </div>

          {/* 5. DESCRIPCIÓN */}
          {event.description && (
            <div className="bg-night-800/50 border border-night-700 rounded-3xl p-6 sm:p-8 mb-8">
              <h3 className="text-xl font-bold mb-4 text-white">Acerca del evento</h3>
              <p className="text-gray-400 whitespace-pre-line leading-relaxed text-lg">
                {event.description}
              </p>
            </div>
          )}

        </div>
      </main>

      {/* MODAL MODERNO */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button 
            onClick={() => setIsImageModalOpen(false)}
            aria-label="Cerrar imagen"
            title="Cerrar imagen"
            className="absolute top-4 right-4 bg-night-800/50 text-gray-300 p-3 rounded-full border border-night-700/50 backdrop-blur-md z-50"
          >
            <X size={24} />
          </button>
          {isVideo ? (
            <video src={event.imageUrl} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={event.imageUrl} alt={event.title} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </>
  );
}