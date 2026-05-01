'use client';

import { useEffect, useState, use } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
// Sumamos Share2 (Compartir) y Check (Tilde de copiado)
import { ArrowLeft, MapPin, Calendar, Music, Loader2, X, ZoomIn, PlayCircle, Heart, Building, Share2, Check } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';

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
  
  // NUEVO: Estado para saber si el link se copió (para compus de escritorio)
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
          
          setLikesCount(eventDataCompleto.likes !== undefined ? eventDataCompleto.likes : (eventDataCompleto.rating || 0));
          
          if (localStorage.getItem(`liked_${id}`)) {
            setHasLiked(true);
          }
        } else {
          console.log("No se encontró el evento");
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

  // NUEVA FUNCIÓN PARA COMPARTIR
  const handleShare = async () => {
    if (!event) return;

    const shareData = {
      title: event.title,
      text: `¡Mirá esta joda en Tucumán! 🔥 ${event.title} en ${event.venue || event.location}`,
      url: window.location.href,
    };

    // Si está en celular o navegador moderno, abre el menú de apps
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Compartir cancelado o con error:', err);
      }
    } else {
      // Si está en una PC vieja que no soporta el menú, copia el link
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500); // Vuelve al ícono normal después de 2.5s
      } catch (err) {
        console.error("Error copiando el texto", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-night-900 flex flex-col items-center justify-center text-brand-primary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="text-gray-400">Cargando detalles de la joda...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-night-900 flex flex-col items-center justify-center text-white p-4">
        <h2 className="text-2xl font-bold mb-4">Evento no encontrado</h2>
        <Link href="/" className="text-brand-primary hover:underline flex items-center gap-2 bg-night-800 px-6 py-3 rounded-xl border border-night-700">
          <ArrowLeft size={20} /> Volver a la cartelera
        </Link>
      </div>
    );
  }

  const handleWhatsAppClick = () => {
    const cleanPhone = event.phone.replace(/\D/g, '');
    const message = `Hola! Vengo de Jodas Tucumanas. Quiero info del evento: *${event.title}*`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const isVideo = event.mediaType === 'video';

  return (
    <>
      <main className="min-h-screen bg-night-900 text-white py-6 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span className="font-medium">Volver a la cartelera</span>
          </Link>

          <div className="bg-night-800 rounded-2xl overflow-hidden border border-night-700 shadow-xl">
            
            <div 
              className="w-full h-64 sm:h-96 bg-night-900 relative cursor-pointer group"
              onClick={() => setIsImageModalOpen(true)}
              title={isVideo ? "Ver video completo" : "Ver flyer completo"}
            >
              {isVideo ? (
                <video 
                  src={event.imageUrl} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-70 pointer-events-none"
                />
              ) : (
                <img 
                  src={event.imageUrl} 
                  alt={event.title} 
                  className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-70"
                />
              )}
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/60 backdrop-blur-sm p-4 rounded-full text-white">
                  {isVideo ? <PlayCircle size={40} /> : <ZoomIn size={32} />}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 bg-brand-primary/20 text-brand-primary px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider border border-brand-primary/30">
                  <Music className="w-4 h-4 shrink-0" />
                  {event.musicType}
                </span>
                
                {/* BOTONES DE ACCIÓN (Compartir y Me gusta) */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleShare}
                    title="Compartir evento"
                    className="flex items-center justify-center p-2.5 rounded-xl bg-night-900 text-gray-300 border border-night-700 hover:bg-night-700 hover:text-white transition-all"
                  >
                    {isCopied ? <Check size={20} className="text-green-400" /> : <Share2 size={20} />}
                  </button>

                  <button 
                    onClick={handleLike}
                    disabled={hasLiked || isLiking}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      hasLiked 
                        ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                        : 'bg-night-900 text-gray-300 border-night-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current scale-110' : 'scale-100'} transition-transform`} />
                    {likesCount} {likesCount === 1 ? 'Me gusta' : 'Me gusta'}
                  </button>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                {event.title}
              </h1>

              <div className="flex flex-col gap-4 mb-8 bg-night-900/50 p-5 rounded-xl border border-night-700">
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-brand-accent shrink-0" />
                  <span className="text-gray-200 capitalize text-lg">{formatearFecha(event.date)}</span>
                </div>

                {event.venue && (
                  <div className="flex items-center gap-3">
                    <Building className="w-6 h-6 text-brand-accent shrink-0" />
                    <span className="text-white font-bold text-lg">{event.venue}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-brand-accent shrink-0" />
                  <span className="text-gray-200 text-lg">
                    {event.location}
                    {event.locality && event.locality !== 'Interior / Otra' && ` - ${event.locality}`}
                  </span>
                </div>

              </div>

              <button 
                onClick={handleWhatsAppClick}
                className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
              >
                <SiWhatsapp className="w-6 h-6 shrink-0" />
                <span>Consultar Reservas</span>
              </button>

              <hr className="border-night-700 my-8" />

              <div>
                <h3 className="text-xl font-bold mb-4 text-white">Acerca del evento</h3>
                <p className="text-gray-400 whitespace-pre-line leading-relaxed text-lg">
                  {event.description}
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>

      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button 
            aria-label="Cerrar vista completa"
            title="Cerrar vista completa"
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-night-800/50 text-gray-300 hover:text-white hover:bg-night-700 p-3 rounded-full transition-all border border-night-700/50 backdrop-blur-md z-50"
          >
            <X size={24} />
          </button>
          
          {isVideo ? (
            <video 
              src={event.imageUrl} 
              controls 
              autoPlay 
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
          ) : (
            <img 
              src={event.imageUrl} 
              alt={`Flyer de ${event.title}`} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
}