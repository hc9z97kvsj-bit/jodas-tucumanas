'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Heart, Share2, MapPin, Music, ArrowRight, CalendarDays } from 'lucide-react';

interface EventCardProps {
  id: string;
  title: string;
  venue?: string;
  imageUrl: string;
  location: string;
  locality?: string; // 👈 AGREGAMOS LA LOCALIDAD ACÁ
  date: string;
  musicType: string;
  rating?: number;
  likes?: number;
  mediaType?: string;
}

export default function EventCard({
  id,
  title,
  venue,
  imageUrl,
  location,
  locality, // 👈 LA RECIBIMOS ACÁ
  date,
  musicType,
  likes = 0,
  mediaType,
}: EventCardProps) {
  const [likesCount, setLikesCount] = useState(Number(likes));
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const liked = localStorage.getItem(`liked_${id}`);
    if (liked === 'true') {
      setHasLiked(true);
    }
  }, [id]);

  const formatFriendlyDate = (dateString: string) => {
    try {
      const [year, month, day] = dateString.split('T')[0].split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      return `${dias[dateObj.getDay()]} ${Number(day)} de ${meses[dateObj.getMonth()]}`;
    } catch {
      return dateString.split('T')[0];
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title: title,
      text: `¡Mirá esta joda en Tucumán! 🔥 ${title} en ${venue || location}`,
      url: `${window.location.origin}/eventos/${id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Compartir cancelado o con error:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500); 
      } catch (err) {
        console.error("Error copiando el texto", err);
      }
    }
  };

  const isVideo = mediaType === 'video' || (imageUrl && imageUrl.toLowerCase().includes('.mp4'));

  return (
    <Link href={`/eventos/${id}`} className="group block h-full">
      <div className="bg-night-800 rounded-2xl border border-night-700 overflow-hidden hover:border-brand-primary/50 transition-all duration-300 h-full flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-2 relative">
        
        <div className="relative aspect-[4/5] w-full bg-night-900 overflow-hidden">
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 z-10" />

          {isVideo ? (
            <video
              src={imageUrl}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
          )}
          
          <div className="absolute top-3 right-3 z-20 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 text-white text-xs font-bold shadow-lg">
            <Music size={12} className="text-brand-primary" />
            {musicType}
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col bg-night-800 relative z-20">
          
          <h3 className="text-xl font-extrabold text-white mb-1 line-clamp-1 leading-tight group-hover:text-brand-primary transition-colors">
            {title}
          </h3>
          
          {venue && (
            <p className="text-sm text-brand-primary font-semibold mb-3 line-clamp-1">
              {venue}
            </p>
          )}

          <div className="space-y-3 mt-3 mb-6 text-gray-300 text-sm">
            <div className="flex items-center gap-3">
              <div className="bg-night-900 p-1.5 rounded-lg text-brand-accent shadow-inner border border-night-700/50">
                <CalendarDays size={16} />
              </div>
              <span className="font-semibold capitalize tracking-wide">{formatFriendlyDate(date)}</span>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-night-900 p-1.5 rounded-lg text-green-400 shadow-inner border border-night-700/50 shrink-0 mt-0.5">
                <MapPin size={16} />
              </div>
              {/* 👈 ACÁ UNIMOS DIRECCIÓN + LOCALIDAD */}
              <span className="line-clamp-2 font-medium text-gray-400 leading-relaxed">
                {location}{locality && locality !== 'Interior / Otra' && locality !== 'Todas' ? ` - ${locality}` : ''}
              </span>
            </div>
          </div>

          <div className="mt-auto">
            <hr className="border-night-700 mb-4" />

            <div className="flex items-center justify-between">
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleLike}
                  disabled={isLiking || hasLiked}
                  aria-label="Dar me gusta"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                    hasLiked 
                      ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary cursor-default shadow-inner' 
                      : 'border-night-600 bg-night-700/50 text-gray-300 hover:bg-night-600 hover:text-white hover:border-night-500'
                  }`}
                >
                  <Heart size={16} className={hasLiked ? "fill-brand-primary text-brand-primary" : ""} />
                  <span className="font-bold text-sm">{likesCount}</span>
                </button>

                <button 
                  onClick={handleShare}
                  aria-label="Compartir evento"
                  className="flex items-center justify-center p-1.5 rounded-lg border border-night-600 bg-night-700/50 text-gray-300 hover:bg-night-600 hover:text-white hover:border-night-500 transition-all"
                  title="Compartir"
                >
                  <Share2 size={16} />
                </button>
              </div>

{/* Llamado a la acción (Siempre visible en celular, Hover en PC) */}
              <div className="flex items-center text-brand-primary font-bold text-sm uppercase tracking-wider gap-1 opacity-100 sm:opacity-0 sm:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <span>Ver Info</span>
                <ArrowRight size={16} className="animate-pulse" />
              </div>

            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}