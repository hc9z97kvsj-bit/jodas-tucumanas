'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Heart, Share2, MapPin, Music, ArrowUpRight, Calendar, Clock, UserCircle, ChevronRight, Beer, Flame } from 'lucide-react';

/* ─────────────────────────── TYPES ─────────────────────────── */
export interface EventData {
  id: string;
  category?: string;
  title: string;
  venue?: string;
  imageUrl: string;
  profileImageUrl?: string;
  location: string;
  locality?: string;
  date: string;
  schedule?: Record<string, { isOpen: boolean; open?: string; close?: string }>;
  musicType: string;
  description?: string;
  rating?: number;
  likes?: number;
  mediaType?: string;
  phone?: string;
}

interface EventCardProps {
  event: EventData;
  index?: number;
}

/* ─────────────────────────── HELPERS ─────────────────────────── */
function formatFriendlyDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Fecha a confirmar';
  try {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (isNaN(d.getTime())) return dateStr;
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[d.getDay()]} ${Number(day)} de ${meses[d.getMonth()]}`;
  } catch {
    return dateStr;
  }
}

function getTodaySchedule(schedule?: EventData['schedule']): { isOpen: boolean; text: string } | null {
  if (!schedule) return null;
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const todayData = schedule[days[new Date().getDay()]];
  if (!todayData) return null;
  return todayData.isOpen
    ? { isOpen: true, text: `Hoy: ${todayData.open} – ${todayData.close}` }
    : { isOpen: false, text: 'Hoy: Cerrado' };
}

/* ─────────────────────────── HOOK LIKE ─────────────────────────── */
function useLike(eventId: string, initialLikes: number) {
  const key = `liked_jt_${eventId}`;
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(key) === 'true') setHasLiked(true);
  }, [key]);

  const handleLike = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault(); 
      e.stopPropagation();
      if (hasLiked || isLiking) return;
      setIsLiking(true);
      setLikesCount(p => p + 1);
      setHasLiked(true);
      localStorage.setItem(key, 'true');
      try {
        await updateDoc(doc(db, 'eventos', eventId), { likes: increment(1) });
      } catch (error) {
        console.error("Error liking:", error);
      } finally {
        setIsLiking(false);
      }
    },
    [hasLiked, isLiking, key, eventId],
  );

  return { likesCount, hasLiked, handleLike };
}

function shareOnWhatsApp(e: React.MouseEvent, event: EventData) {
  e.preventDefault();
  e.stopPropagation();
  const url = `${window.location.origin}/eventos/${event.id}`;
  const lugar = event.venue ?? event.locality ?? event.location ?? '';
  const fechaOBar = event.category === 'bar' ? '🍻 Directorio de Establecimientos' : `📅 ${formatFriendlyDate(event.date)}`;
  const texto = `🔥 ¡Mirá esta recomendación en Tucumán!\n\n*${event.title}*\n📍 ${lugar}\n${fechaOBar}\n\nToda la info acá:\n👉 ${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
}

/* ══════════════════════════════════════════════════════════════
   BAR CARD  —  Directorio Gastronómico
══════════════════════════════════════════════════════════════ */
function BarCard({ event }: { event: EventData }) {
  const { likesCount, hasLiked, handleLike } = useLike(event.id, Number(event.likes ?? 0));
  const todaySchedule = getTodaySchedule(event.schedule);

  return (
    <Link href={`/eventos/${event.id}`} className="group block h-full outline-none">
      <div className="relative flex flex-col items-center text-center p-6 h-full rounded-[24px] bg-[#0e0e0e] border border-white/5 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-white/10 group-hover:shadow-[0_20px_56px_rgba(0,0,0,0.7)] overflow-hidden">
        
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#EC4899] to-[#06B6D4] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-[#EC4899]/10 text-[#EC4899] border border-[#EC4899]/20">
          <Beer size={10} /> {event.musicType ?? 'Bar'}
        </div>
        {todaySchedule && (
          <div className={`absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${todaySchedule.isOpen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {todaySchedule.isOpen ? '● Abierto' : '● Cerrado'}
          </div>
        )}

        <div className="relative mt-10 mb-5">
          <div className="absolute -inset-3 bg-gradient-to-br from-[#EC4899] to-[#06B6D4] opacity-0 group-hover:opacity-30 transition-all duration-700 -z-10 blur-xl rounded-full" />
          <div className="w-[92px] h-[92px] rounded-2xl group-hover:rounded-[1.75rem] transition-all duration-500 flex items-center justify-center overflow-hidden bg-[#1c1c1c] border-2 border-white/5 shadow-xl">
            {event.profileImageUrl ? (
              <img src={event.profileImageUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={36} className="text-white/10" />
            )}
          </div>
        </div>

        <h3 className="font-black text-white text-[18px] leading-tight mb-1 group-hover:text-[#EC4899] transition-colors duration-300 line-clamp-1">
          {event.title}
        </h3>
        <p className="text-[11px] text-white/40 font-medium mb-4 line-clamp-1">
          {event.venue ?? event.locality}
        </p>

        {todaySchedule && (
          <div className="w-full flex items-center justify-center gap-2 mb-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-semibold">
            <Clock size={12} className="text-white/30 shrink-0" />
            <span className={todaySchedule.isOpen ? 'text-emerald-400' : 'text-white/40'}>{todaySchedule.text}</span>
          </div>
        )}

        <div className="w-full flex items-center justify-center gap-1.5 mb-6 text-[11px] font-medium text-white/30 line-clamp-1">
          <MapPin size={12} className="text-[#06B6D4] shrink-0" />
          <span>{event.location}{event.locality && event.locality !== 'Todas' ? ` · ${event.locality}` : ''}</span>
        </div>

        <div className="mt-auto w-full flex flex-col gap-2">
          <div className="w-full py-2.5 rounded-[14px] flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest bg-[#EC4899]/10 text-[#EC4899] border border-[#EC4899]/30 group-hover:bg-[#EC4899]/20 transition-all">
            Ver Establecimiento <ChevronRight size={14} />
          </div>
          <div className="flex gap-2 w-full">
            <button onClick={handleLike} disabled={hasLiked} aria-label="Me gusta" className={`flex-1 py-2.5 rounded-[14px] flex items-center justify-center gap-1.5 text-xs font-bold transition-all border ${hasLiked ? 'bg-[#EC4899]/10 border-[#EC4899]/30 text-[#EC4899] cursor-default' : 'bg-white/5 border-white/10 text-white/30 hover:text-[#EC4899] hover:bg-white/10'}`}>
              <Heart size={14} className={hasLiked ? 'fill-[#EC4899]' : ''} /> {likesCount}
            </button>
            <button onClick={e => shareOnWhatsApp(e, event)} aria-label="Compartir" className="flex-1 py-2.5 rounded-[14px] flex items-center justify-center gap-1.5 text-xs font-bold transition-all bg-[#25D366]/10 border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 border">
              <Share2 size={14} /> Compartir
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════
   EVENT CARD  —  Cartelera Nocturna
══════════════════════════════════════════════════════════════ */
function EventPartyCard({ event }: { event: EventData }) {
  const { likesCount, hasLiked, handleLike } = useLike(event.id, Number(event.likes ?? 0));
  const isVideo = event.mediaType === 'video' || Boolean(event.imageUrl?.toLowerCase().includes('.mp4'));

  return (
    <Link href={`/eventos/${event.id}`} className="group block h-full outline-none">
      <div className="relative flex flex-col h-full rounded-[24px] bg-[#0e0e0e] border border-white/5 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-white/10 group-hover:shadow-[0_20px_56px_rgba(0,0,0,0.7)]">
        
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 rounded-t-[24px]" />

        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[24px] bg-[#111]">
          <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/15 to-transparent" />
          <div className="absolute inset-0 z-[2] transition-colors duration-500 group-hover:bg-black/20" />

          {event.imageUrl ? (
            isVideo ? (
              <video src={event.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" autoPlay loop muted playsInline />
            ) : (
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#180d2e] to-[#0e0e1a]">
              <Flame size={52} className="text-[#8B5CF6]/30" />
            </div>
          )}

          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-black/60 backdrop-blur-md border border-[#8B5CF6]/40 text-[#A78BFA]">
            <Music size={10} /> {event.musicType ?? 'Evento'}
          </div>

          <button onClick={e => shareOnWhatsApp(e, event)} aria-label="Compartir" className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 text-[#25D366] opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-[#25D366]/20">
            <Share2 size={13} />
          </button>
        </div>

        {/* LOGO FLOTANTE CORRECTO (SIN CORTARSE) */}
        <div className="absolute z-30 right-4 translate-y-[-50%]" style={{ top: 'calc(100% * (5/4) / (5/4 + 1))' }}>
          <div className="w-[52px] h-[52px] rounded-full border-[3px] border-[#0e0e0e] bg-[#1c1c1c] shadow-[0_4px_16px_rgba(0,0,0,0.6)] overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            {event.profileImageUrl ? (
              <img src={event.profileImageUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={24} className="text-white/20" />
            )}
          </div>
        </div>

        <div className="p-5 pt-6 flex flex-col flex-grow bg-[#0e0e0e] rounded-b-[24px]">
          {event.venue && (
            <p className="font-black uppercase text-[10px] tracking-widest text-[#8B5CF6] mb-1.5 line-clamp-1">
              {event.venue}
            </p>
          )}

          <h3 className="font-black text-white text-[18px] leading-[1.3] mb-4 group-hover:text-[#A78BFA] transition-colors duration-300 line-clamp-2">
            {event.title}
          </h3>

          <div className="flex flex-col gap-3 flex-grow">
            <div className="flex items-center gap-3 text-white/50">
              <div className="w-[30px] h-[30px] rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center shrink-0">
                <Calendar size={13} className="text-[#8B5CF6]" />
              </div>
              <span className="capitalize font-medium text-[13px]">{formatFriendlyDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-3 text-white/40">
              <div className="w-[30px] h-[30px] rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center shrink-0">
                <MapPin size={13} className="text-[#06B6D4]" />
              </div>
              <span className="font-medium text-[12px] line-clamp-1">
                {event.location}{event.locality && event.locality !== 'Todas' ? ` · ${event.locality}` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
            <button onClick={handleLike} disabled={hasLiked} aria-label="Me gusta" className={`flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${hasLiked ? 'text-[#EC4899] cursor-default' : 'text-white/30 hover:text-[#EC4899]'}`}>
              <Heart size={18} className={hasLiked ? 'fill-[#EC4899]' : ''} />
              <span className="text-[15px] font-bold">{likesCount}</span>
            </button>

            <div className="flex items-center gap-1 font-black uppercase text-[10px] tracking-widest text-white/20 group-hover:text-[#A78BFA] transition-colors duration-300">
              Ver detalles <ArrowUpRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════
   PUBLIC EXPORT
══════════════════════════════════════════════════════════════ */
export default function EventCard({ event, index = 0 }: EventCardProps) {
  if (event.category === 'bar') {
    return <BarCard event={event} />;
  }
  return <EventPartyCard event={event} />;
}