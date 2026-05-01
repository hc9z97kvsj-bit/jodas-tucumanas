'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Heart, Share2, MapPin, Calendar, Music } from 'lucide-react';

interface EventCardProps {
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
}

export default function EventCard({
  id,
  title,
  venue,
  imageUrl,
  location,
  date,
  musicType,
  likes = 0,
  mediaType, // Acá recuperamos el dato de si es foto o video
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

  const formatDate = (dateString: string) => {
    try {
      const [year, month, day] = dateString.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
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

  // Verificamos si es video por la base de datos o si la URL termina en .mp4
  const isVideo = mediaType === 'video' || (imageUrl && imageUrl.toLowerCase().includes('.mp4'));

  return (
    <Link href={`/eventos/${id}`} className="group block h-full">
      <div className="bg-night-800 rounded-2xl border border-night-700 overflow-hidden hover:border-night-600 transition-all duration-300 h-full flex flex-col hover:shadow-xl hover:-translate-y-1">
        
        {/* Cabecera con Imagen O Video */}
        <div className="relative aspect-[4/3] w-full bg-night-900 overflow-hidden">
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
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          )}
          
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 text-white text-xs font-semibold shadow-lg">
            <Music size={12} className="text-brand-primary" />
            {musicType}
          </div>
        </div>

        {/* Cuerpo de la Tarjeta */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-brand-primary transition-colors">
            {title}
          </h3>
          
          <div className="space-y-2 mt-auto mb-5 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500 flex-shrink-0" />
              <span>{formatDate(date)}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-1">{venue ? `${venue} - ${location}` : location}</span>
            </div>
          </div>

          <hr className="border-night-700 mb-4" />

          {/* Botones de Interacción */}
          <div className="flex items-center justify-between">
            <button 
              onClick={handleLike}
              disabled={isLiking || hasLiked}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                hasLiked 
                  ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary cursor-default' 
                  : 'border-night-600 bg-night-700/50 text-gray-300 hover:bg-night-600 hover:text-white'
              }`}
            >
              <Heart size={16} className={hasLiked ? "fill-brand-primary text-brand-primary" : ""} />
              <span className="font-semibold text-sm">{likesCount}</span>
            </button>

            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-night-600 bg-night-700/50 text-gray-300 hover:bg-night-600 hover:text-white transition-all text-sm font-semibold"
            >
              <Share2 size={16} />
              {isCopied ? '¡Copiado!' : 'Compartir'}
            </button>
          </div>
        </div>

      </div>
    </Link>
  );
}