'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  collection, getDocs, orderBy, query,
  doc, setDoc, getDoc, increment, updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard from '@/components/EventCard';
import {
  Loader2, MapPin, Music, FilterX, Calendar, Eye,
  UserCircle, Heart, Star, Filter, Zap, ArrowUpRight, ChevronRight, Beer
} from 'lucide-react';

/* ══════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════ */
interface Promotion {
  id: string;
  url: string;
  mediaType: string;
  active: boolean;
}

interface EventData {
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
  instagram?: string;
  youtube?: string;
  phone?: string;
  /* New promotions format (admin current) */
  promotions?: Promotion[];
  /* Legacy fields */
  promoUrl?: string;
  promoMediaType?: string;
  promoActive?: boolean;
}

type Tab = 'evento' | 'bar';

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
function formatEventDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${dias[d.getDay()]} ${Number(day)} de ${meses[d.getMonth()]}`;
  } catch {
    return dateStr;
  }
}

function formatShortDate(s: string): string {
  if (s === 'Todas') return 'Todas las fechas';
  try {
    const [year, month, day] = s.split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[d.getDay()]} ${Number(day)} ${meses[Number(month) - 1]}`;
  } catch {
    return s;
  }
}

function normalizeInstagram(handle: string): string {
  if (handle.includes('http')) return handle;
  return `https://instagram.com/${handle.replace('@', '')}`;
}

/** Returns active promos for an event (supports both new and legacy fields) */
function getActivePromos(ev: EventData): Promotion[] {
  if (Array.isArray(ev.promotions) && ev.promotions.length > 0) {
    const active = ev.promotions.filter(p => p.active && !!p.url);
    if (active.length > 0) return active;
    const anyUrl = ev.promotions.filter(p => !!p.url);
    if (anyUrl.length > 0) return anyUrl;
  }
  if (ev.promoUrl) {
    return [{ id: 'legacy', url: ev.promoUrl, mediaType: ev.promoMediaType ?? 'image', active: true }];
  }
  return [];
}

/* ══════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════ */
function useEvents() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'eventos'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({
          id: d.id,
          category: d.data().category || 'evento',
          ...d.data(),
        })) as EventData[];

        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - 12);

        setEvents(
          all.filter(e => {
            if (e.category === 'dj') return false;
            if (e.category === 'bar') return true;
            if (!e.date) return false;
            return new Date(e.date) >= cutoffDate;
          })
        );
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { events, loading };
}

function useLikes(prefix: string) {
  const [liked, setLiked] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    const result: Record<string, boolean> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(`liked_${prefix}_`)) {
        result[k.replace(`liked_${prefix}_`, '')] = true;
      }
    }
    return result;
  });

  const toggleLike = useCallback(async (id: string, onOptimistic?: () => void) => {
    if (liked[id]) return;
    setLiked(prev => ({ ...prev, [id]: true }));
    localStorage.setItem(`liked_${prefix}_${id}`, 'true');
    onOptimistic?.();
    try {
      await updateDoc(doc(db, 'eventos', id), { likes: increment(1) });
    } catch (err) {
      console.error(`Error updating like for ${id}:`, err);
    }
  }, [liked, prefix]);

  return { liked, toggleLike };
}

function useVisitCount() {
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    (async () => {
      const ref = doc(db, 'estadisticas', 'visitas_globales');
      const visited = sessionStorage.getItem('jodas_tucumanas_visited');
      try {
        if (!visited) {
          await setDoc(ref, { count: increment(1) }, { merge: true });
          sessionStorage.setItem('jodas_tucumanas_visited', 'true');
        }
        const snap = await getDoc(ref);
        if (snap.exists()) setVisitCount(snap.data().count as number);
      } catch (err) {
        console.error('Error fetching visit count:', err);
      }
    })();
  }, []);

  return visitCount;
}

/* ══════════════════════════════════════════════
   COMPONENTE: PromoModal — centrado, responsivo,
   con timer automático, soporte teclado y diseño
   mejorado para eventos y bares.
══════════════════════════════════════════════ */
type PromoSlide =
  | { kind: 'event'; ev: EventData; promo: Promotion }
  | { kind: 'bar';   ev: EventData };

const SLIDE_DURATION = 6000; // ms por slide

function PromoModal({ events }: { events: EventData[] }) {
  const [visible,  setVisible]  = useState(false);
  const [index,    setIndex]    = useState(0);
  const [progress, setProgress] = useState(0);   // 0-100 para la barra animada
  const [paused,   setPaused]   = useState(false);

  /* ── Build slide list ── */
  const slides = useMemo<PromoSlide[]>(() => {
    const result: PromoSlide[] = [];
    for (const ev of events) {
      const promos = getActivePromos(ev);
      if (promos.length === 0) continue;
      if (ev.category === 'bar') {
        result.push({ kind: 'bar', ev });
      } else {
        result.push({ kind: 'event', ev, promo: promos[0] });
      }
    }
    return result;
  }, [events]);

  /* ── Show on every page load ── */
  useEffect(() => {
    if (slides.length === 0) return;
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, [slides.length]);

  /* ── Keyboard: Escape to close, arrows to navigate ── */
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      dismiss();
      if (e.key === 'ArrowRight')  goNext();
      if (e.key === 'ArrowLeft')   goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, index, slides.length]); // eslint-disable-line

  /* ── Auto-advance timer ── */
  useEffect(() => {
    if (!visible || paused || slides.length <= 1) return;
    setProgress(0);
    const step = 50;
    const increment = (step / SLIDE_DURATION) * 100;
    const id = setInterval(() => {
      setProgress(p => {
        if (p + increment >= 100) {
          clearInterval(id);
          setIndex(i => {
            if (i + 1 < slides.length) return i + 1;
            dismiss();
            return i;
          });
          return 0;
        }
        return p + increment;
      });
    }, step);
    return () => clearInterval(id);
  }, [visible, index, paused, slides.length]); // eslint-disable-line

  const dismiss = () => {
    setVisible(false);
  };

  const goNext = () => {
    if (index + 1 < slides.length) { setIndex(i => i + 1); setProgress(0); }
    else dismiss();
  };

  const goPrev = () => {
    if (index > 0) { setIndex(i => i - 1); setProgress(0); }
  };

  const slide  = slides[index];
  const isLast = index === slides.length - 1;

  if (!slide) return null;

  const isBar   = slide.kind === 'bar';
  const acColor = isBar ? '#fb923c' : '#8B5CF6';
  const acGlow  = isBar ? 'rgba(251,146,60,0.35)' : 'rgba(139,92,246,0.35)';
  const acBg    = isBar ? 'linear-gradient(135deg,#fb923c,#ea6c0a)' : 'linear-gradient(135deg,#8B5CF6,#EC4899)';

  return (
    <AnimatePresence>
      {visible && (
        /* ── Backdrop — click outside to close ── */
        <motion.div
          key="promo-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={dismiss}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        >
          {/* ── Card — flex-column, fixed max-height, overflow hidden → no scrollbar ── */}
          <motion.div
            key={`promo-card-${index}`}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.96,  y: -8 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={e => e.stopPropagation()}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 400,
              /* tall enough for portrait promos, never taller than viewport */
              height: isBar ? 'auto' : 'min(86dvh, 600px)',
              maxHeight: '90dvh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 24,
              background: '#0d0d11',
              border: `1px solid ${isBar ? 'rgba(251,146,60,0.25)' : 'rgba(139,92,246,0.25)'}`,
              boxShadow: `0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)`,
            }}
          >
            {/* Ambient glow */}
            <div style={{
              position: 'absolute', inset: -1, borderRadius: 25, zIndex: -1,
              background: acBg, filter: 'blur(20px)', opacity: 0.25, pointerEvents: 'none',
            }} />

            {/* ── Story-style progress bars ── */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
              display: 'flex', gap: 4, padding: '12px 14px 0',
              background: 'linear-gradient(to bottom,rgba(0,0,0,0.55),transparent)',
              borderRadius: '24px 24px 0 0',
            }}>
              {slides.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 99, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.15)',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    background: i < index ? '#fff' : i === index ? '#fff' : 'transparent',
                    width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                    transition: i === index ? 'none' : 'width 0.2s',
                  }} />
                </div>
              ))}
            </div>

            {/* ── Close button (always on top) ── */}
            <button
              onClick={dismiss}
              aria-label="Cerrar"
              style={{
                position: 'absolute', top: 14, right: 14, zIndex: 30,
                width: 32, height: 32, borderRadius: 99,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* ════════════════════════════════
                EVENT SLIDE — fills available height, no aspect ratio
            ════════════════════════════════ */}
            {slide.kind === 'event' && (() => {
              const { ev, promo } = slide;
              return (
                <>
                  {/* Media — flex:1 so it takes ALL remaining vertical space */}
                  <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    {promo.mediaType === 'video' ? (
                      <video src={promo.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted loop playsInline />
                    ) : (
                      <img src={promo.url} alt={`Promo: ${ev.title}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    {/* Gradient overlays */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.4) 0%,transparent 25%,transparent 50%,#0d0d11 100%)' }} />

                    {/* Category badge */}
                    <div style={{
                      position: 'absolute', bottom: 16, left: 16,
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '5px 12px', borderRadius: 99,
                      background: 'rgba(224,64,251,0.18)',
                      border: '1px solid rgba(224,64,251,0.4)',
                      backdropFilter: 'blur(12px)',
                      fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#e040fb',
                    }}>
                      <Zap size={9} />Evento · Promo Exclusiva
                    </div>

                    {/* Profile logo */}
                    {ev.profileImageUrl && (
                      <div style={{
                        position: 'absolute', bottom: -18, right: 18,
                        width: 40, height: 40, borderRadius: 11,
                        border: '2px solid #0d0d11', overflow: 'hidden',
                        background: '#1a1a1a', boxShadow: '0 4px 14px rgba(0,0,0,0.7)',
                      }}>
                        <img src={ev.profileImageUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>

                  {/* Info — fixed height, never grows */}
                  <div style={{ flexShrink: 0, padding: ev.profileImageUrl ? '24px 20px 6px' : '16px 20px 6px' }}>
                    {ev.venue && (
                      <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.22em', color: '#8B5CF6', marginBottom: 4 }}>
                        {ev.venue}
                      </p>
                    )}
                    <p style={{ fontSize: 19, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: ev.date ? 5 : 0 }}>
                      {ev.title}
                    </p>
                    {ev.date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={11} color="rgba(255,255,255,0.3)" />
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                          {formatEventDate(ev.date)}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* ════════════════════════════════
                BAR SLIDE — promo announcement
            ════════════════════════════════ */}
            {slide.kind === 'bar' && (() => {
              const { ev } = slide;
              return (
                <div style={{ padding: '56px 20px 8px' }}>

                  {/* Avatar hero */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                    <div style={{
                      width: 84, height: 84, borderRadius: 22,
                      border: `2px solid ${acColor}44`,
                      overflow: 'hidden', background: '#1c1c22',
                      boxShadow: `0 0 0 8px ${acColor}10, 0 12px 32px rgba(0,0,0,0.6)`,
                      marginBottom: 16,
                    }}>
                      {ev.profileImageUrl ? (
                        <img src={ev.profileImageUrl} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Beer size={36} color={acColor} />
                        </div>
                      )}
                    </div>

                    {/* Badge */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 12px', borderRadius: 99, marginBottom: 10,
                      background: `${acColor}18`, border: `1px solid ${acColor}40`,
                      fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.16em', color: acColor,
                    }}>
                      <Beer size={9} />Bar · Promoción activa
                    </div>

                    <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.15, textAlign: 'center', marginBottom: 4 }}>
                      {ev.title}
                    </p>
                    {(ev.venue || ev.locality) && (
                      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontWeight: 600 }}>
                        {[ev.venue, ev.locality].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>

                  {/* Promo banner */}
                  <div style={{
                    padding: '16px 18px', borderRadius: 16, marginBottom: 4,
                    background: `linear-gradient(135deg,${acColor}12,${acColor}06)`,
                    border: `1px solid ${acColor}25`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                        background: acBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 12px ${acGlow}`,
                      }}>
                        <Zap size={14} color="#fff" />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 900, color: acColor, lineHeight: 1.2 }}>
                        ¡Tienen promos disponibles!
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, fontWeight: 500 }}>
                      Entrá al perfil y mirá los flyers y ofertas exclusivas que cargaron.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* ── Footer: always at bottom, flexShrink:0 ── */}
            <div style={{ flexShrink: 0, padding: '10px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

              {/* Slide counter dots + navigation row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                {/* Dots */}
                <div style={{ display: 'flex', gap: 5 }}>
                  {slides.length > 1 && slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setIndex(i); setProgress(0); }}
                      aria-label={`Ir al slide ${i + 1}`}
                      style={{
                        width: i === index ? 16 : 5, height: 5, borderRadius: 99,
                        background: i === index ? acColor : 'rgba(255,255,255,0.18)',
                        border: 'none', cursor: 'pointer', padding: 0,
                        transition: 'all 0.25s',
                      }}
                    />
                  ))}
                </div>

                {/* Prev / Next arrows */}
                {slides.length > 1 && (
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button
                      onClick={goPrev}
                      disabled={index === 0}
                      aria-label="Anterior"
                      style={{
                        width: 32, height: 32, borderRadius: 10, cursor: index === 0 ? 'default' : 'pointer',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: index === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                      }}
                    >←</button>
                    <button
                      onClick={goNext}
                      aria-label={isLast ? 'Cerrar' : 'Siguiente'}
                      style={{
                        width: 32, height: 32, borderRadius: 10, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                      }}
                    >{isLast ? '✕' : '→'}</button>
                  </div>
                )}
              </div>

              {/* Action buttons row */}
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Primary CTA */}
                <Link
                  href={`/eventos/${slide.ev.id}`}
                  onClick={dismiss}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 14,
                    textAlign: 'center', fontSize: 11, fontWeight: 900,
                    textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff',
                    textDecoration: 'none', background: acBg, boxShadow: `0 4px 16px ${acGlow}`,
                  }}
                >
                  {isBar ? 'Ver promos del bar' : 'Ver evento'}
                </Link>

                {/* Anchor to promo strip section */}
                <a
                  href="#promos-section"
                  onClick={dismiss}
                  style={{
                    padding: '12px 13px', borderRadius: 14, fontSize: 11, fontWeight: 800,
                    color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  Ver todas ↓
                </a>

                {/* Close */}
                <button
                  onClick={dismiss}
                  style={{
                    padding: '12px 13px', borderRadius: 14, fontSize: 11, fontWeight: 700,
                    color: 'rgba(255,255,255,0.25)', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════
   COMPONENTE: PromoStrip
   — Franja horizontal de scroll con todas las
     entidades que tienen promos activas.
     Sirve de referencia rápida desde el modal.
══════════════════════════════════════════════ */
function PromoStrip({ events }: { events: EventData[] }) {
  if (events.length === 0) return null;

  return (
    <section
      id="promos-section"
      className="jt-promo-strip"
      style={{ marginBottom: 40, scrollMarginTop: 80 }}
    >
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, paddingBottom: 14,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 7, height: 26, borderRadius: 4,
            background: 'linear-gradient(180deg,#8B5CF6,#EC4899)',
            boxShadow: '0 0 10px rgba(139,92,246,0.5)',
          }} />
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.15, margin: 0 }}>
              Promos <span style={{ color: '#8B5CF6', textShadow: '0 0 20px rgba(139,92,246,0.5)' }}>Activas</span>
            </h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600, margin: '3px 0 0', letterSpacing: '0.04em' }}>
              Entidades con promos y flyers cargados ahora mismo
            </p>
          </div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 99,
          background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
          fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(139,92,246,0.8)',
        }}>
          <Zap size={9} />{events.length} con promos
        </div>
      </div>

      {/* Horizontal scroll row — hidden scrollbar */}
      <div style={{
        display: 'flex', gap: 12,
        overflowX: 'auto', paddingBottom: 4,
        msOverflowStyle: 'none', scrollbarWidth: 'none',
      }}
        className="hide-scrollbar"
      >
        {events.map(ev => {
          const isBar    = ev.category === 'bar';
          const acColor  = isBar ? '#fb923c' : '#8B5CF6';
          const acBg     = isBar ? 'linear-gradient(135deg,#fb923c,#ea6c0a)' : 'linear-gradient(135deg,#8B5CF6,#EC4899)';
          const label    = isBar ? 'Bar' : 'Evento';

          return (
            <Link
              key={ev.id}
              href={`/eventos/${ev.id}`}
              style={{ textDecoration: 'none', flexShrink: 0 }}
            >
              <div style={{
                width: 130,
                padding: '14px 12px 12px',
                borderRadius: 18,
                background: 'rgba(14,14,14,0.8)',
                border: `1px solid ${acColor}20`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.18s',
                position: 'relative',
              }}>
                {/* Promo indicator dot */}
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 8, height: 8, borderRadius: 99,
                  background: acColor,
                  boxShadow: `0 0 6px ${acColor}`,
                  animation: 'pulse-dot 2s infinite',
                }} />

                {/* Logo / Avatar */}
                <div style={{
                  width: 56, height: 56, borderRadius: 15, overflow: 'hidden',
                  background: '#1c1c22',
                  border: `1.5px solid ${acColor}35`,
                  boxShadow: `0 4px 16px rgba(0,0,0,0.5)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {ev.profileImageUrl ? (
                    <img src={ev.profileImageUrl} alt={ev.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : ev.imageUrl ? (
                    <img src={ev.imageUrl} alt={ev.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Zap size={22} color={acColor} />
                  )}
                </div>

                {/* Name */}
                <p style={{
                  fontSize: 12, fontWeight: 900, color: '#fff', textAlign: 'center',
                  lineHeight: 1.25, margin: 0,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {ev.title}
                </p>

                {/* Promo badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px', borderRadius: 99,
                  background: acBg, boxShadow: `0 2px 8px ${acColor}40`,
                  fontSize: 8, fontWeight: 900, textTransform: 'uppercase',
                  letterSpacing: '0.1em', color: '#fff',
                }}>
                  <Zap size={7} />Promo
                </div>

                {/* Category label */}
                <p style={{
                  fontSize: 9, fontWeight: 700, color: `${acColor}80`,
                  textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0,
                }}>
                  {label}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pulse animation + hide-scrollbar CSS */}
      <style>{`
        @keyframes pulse-dot {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}

/* ══════════════════════════════════════════════
   COMPONENTE: TabNav
══════════════════════════════════════════════ */
function TabNav({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <div
      className="jt-tabs"
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        borderRadius: 99, padding: 4,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {(['evento', 'bar'] as const).map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`jt-tabs__button ${activeTab === tab ? 'is-active' : ''}`}
          style={{
            position: 'relative', padding: '6px 16px', borderRadius: 99,
            fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em',
            cursor: 'pointer', border: 'none', transition: 'all 0.2s',
            ...(activeTab === tab
              ? { background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', color: '#fff', boxShadow: '0 2px 12px rgba(139,92,246,0.4)' }
              : { background: 'transparent', color: 'rgba(255,255,255,0.35)' }),
          }}
        >
          {tab === 'evento' ? 'Eventos' : 'Bares'}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   COMPONENTE: ShareDJButton
══════════════════════════════════════════════ */
function ShareDJButton({ name, id, size }: { name: string; id: string; size: 'featured' | 'compact' }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url  = `${window.location.origin}/eventos/${id}`;
    const text = `¡Votá al Deejay ${name} en Jodas Tucumanas! Dale tu ❤️ para ayudarlo a subir en el ranking 🎧`;
    if (navigator.share) {
      try { await navigator.share({ title: `Deejay ${name}`, text, url }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  const cls28 = {
    width: size === 'featured' ? 32 : 28,
    height: size === 'featured' ? 32 : 28,
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: copied ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${copied ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.08)'}`,
    color: copied ? '#8B5CF6' : 'rgba(255,255,255,0.3)',
    cursor: 'pointer', transition: 'all 0.15s',
  } as React.CSSProperties;

  return (
    <button onClick={handleShare} title={copied ? '¡Copiado!' : 'Compartir'} style={cls28}>
      {copied ? (
        <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════════
   COMPONENTE: DJCardFeatured (TOP 1)
══════════════════════════════════════════════ */
function DJCardFeatured({ dj, onLike, isLiked }: { dj: EventData; onLike: (id: string) => void; isLiked: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="relative group h-full">
      <div className="absolute -inset-[1px] rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity"
        style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899,#06B6D4)', filter: 'blur(8px)' }} />
      <div className="relative rounded-2xl overflow-hidden flex flex-col h-full"
        style={{ background: '#0e0e0e', border: '1px solid rgba(139,92,246,0.5)' }}>
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm bg-[#8B5CF6] text-white shadow-lg shadow-purple-900/50">#1</div>
          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-[#EC4899] text-white shadow-lg">TOP 1</span>
        </div>
        <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/20 to-transparent z-[1]" />
          {dj.imageUrl
            ? <img src={dj.imageUrl} alt={dj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            : <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center"><UserCircle size={80} className="text-white/10" /></div>
          }
          <div className="absolute inset-0 z-[2] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(to top,rgba(139,92,246,0.25),transparent 60%)' }} />
          <div className="absolute bottom-5 left-5 right-5 z-10">
            <p className="text-[#8B5CF6] text-[9px] font-black uppercase tracking-[0.25em] mb-1.5">Tendencia</p>
            <h3 className="font-black text-3xl text-white leading-tight drop-shadow-lg">
              <span className="text-[#EC4899]">Deejay </span>{dj.title}
            </h3>
          </div>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {dj.youtube && (
              <a href={dj.youtube} target="_blank" rel="noopener noreferrer" title="YouTube"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all border border-white/8">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
            )}
            {dj.instagram && (
              <a href={normalizeInstagram(dj.instagram)} target="_blank" rel="noopener noreferrer" title="Instagram"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-pink-500 hover:bg-pink-500/10 transition-all border border-white/8">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </a>
            )}
            <ShareDJButton name={dj.title} id={dj.id} size="featured" />
          </div>
          <button onClick={() => onLike(dj.id)} disabled={isLiked}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-bold transition-all border ${isLiked ? 'bg-[#EC4899]/15 text-[#EC4899] border-[#EC4899]/30 cursor-default' : 'bg-white/4 text-white/35 border-white/8 hover:bg-[#EC4899]/15 hover:text-[#EC4899] hover:border-[#EC4899]/30'}`}>
            <Heart size={13} className={isLiked ? 'fill-[#EC4899]' : ''} />
            <span>{dj.likes || 0}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   COMPONENTE: DJCardCompact (#2+)
══════════════════════════════════════════════ */
function DJCardCompact({ dj, index, onLike, isLiked }: { dj: EventData; index: number; onLike: (id: string) => void; isLiked: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group flex items-center gap-3 p-3 rounded-xl transition-all cursor-default"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-black text-[11px] border"
        style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
        #{index + 1}
      </div>
      <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        {dj.imageUrl
          ? <img src={dj.imageUrl} alt={dj.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          : <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center"><UserCircle size={20} className="text-white/20" /></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm text-white leading-tight truncate group-hover:text-[#8B5CF6] transition-colors">
          <span className="text-[#EC4899] font-black">Deejay </span>{dj.title}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {dj.youtube && (
          <a href={dj.youtube} target="_blank" rel="noopener noreferrer" title="YouTube"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white transition-colors">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        )}
        {dj.instagram && (
          <a href={normalizeInstagram(dj.instagram)} target="_blank" rel="noopener noreferrer" title="Instagram"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-pink-500 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
          </a>
        )}
        <ShareDJButton name={dj.title} id={dj.id} size="compact" />
        <button onClick={() => onLike(dj.id)} disabled={isLiked}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${isLiked ? 'text-[#EC4899] cursor-default' : 'text-white/25 hover:text-[#EC4899]'}`}>
          <Heart size={11} className={isLiked ? 'fill-[#EC4899]' : ''} />
          <span>{dj.likes || 0}</span>
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   COMPONENTE: DJRankingSection
══════════════════════════════════════════════ */
function DJRankingSection({ djsList, djLikes, onLike }: {
  djsList: EventData[]; djLikes: Record<string, boolean>; onLike: (id: string) => void;
}) {
  const top  = djsList[0];
  const rest = djsList.slice(1);
  return (
    <section className="mb-24">
      <div className="mb-8 flex items-end justify-between pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Galeria de <span style={{ color: '#8B5CF6', textShadow: '0 0 16px rgba(139,92,246,0.4)' }}>Deejays</span>
          </h2>
          <p className="text-white/30 text-sm mt-1">Los DJs y productores más votados de la escena local.</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full hidden sm:block"
          style={{ background: 'rgba(139,92,246,0.08)', color: 'rgba(139,92,246,0.7)', border: '1px solid rgba(139,92,246,0.2)' }}>
          {djsList.length} artistas
        </span>
      </div>
      <div className="flex flex-col lg:flex-row gap-5">
        {top && <div className="lg:w-64 xl:w-72 shrink-0"><DJCardFeatured dj={top} onLike={onLike} isLiked={!!djLikes[top.id]} /></div>}
        {rest.length > 0 && (
          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1" style={{ maxHeight: 420 }}>
            {rest.length > 4 && (
              <div className="flex items-center gap-2 mb-1 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                <ChevronRight size={12} className="rotate-90" /><span>Desplazá para ver más</span>
              </div>
            )}
            {rest.map((dj, i) => <DJCardCompact key={dj.id} dj={dj} index={i + 1} onLike={onLike} isLiked={!!djLikes[dj.id]} />)}
          </div>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   COMPONENTE: FeaturedCard — MEJORADO
══════════════════════════════════════════════ */
function FeaturedCard({ event, rank, index, isLiked, onLike }: {
  event: EventData; rank: number; index: number; isLiked: boolean;
  onLike: (id: string, onOptimistic?: () => void) => void;
}) {
  const [localLikeCount, setLocalLikeCount] = useState(Number(event.likes || 0));
  const hasPromo = getActivePromos(event).length > 0;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLike(event.id, () => setLocalLikeCount(p => p + 1));
  };

  const rankColors: Record<number, { accent: string; glow: string; badge: string }> = {
    1: { accent: '#8B5CF6', glow: 'rgba(139,92,246,0.5)', badge: 'bg-[#8B5CF6]' },
    2: { accent: '#06B6D4', glow: 'rgba(6,182,212,0.4)',  badge: 'bg-[#06B6D4]' },
    3: { accent: '#EC4899', glow: 'rgba(236,72,153,0.4)', badge: 'bg-[#EC4899]' },
  };
  const rc = rankColors[rank] ?? rankColors[3];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="relative group h-full"
    >
      {/* Outer glow */}
      <div className="absolute -inset-[1px] rounded-[22px] opacity-0 group-hover:opacity-60 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg,${rc.accent},transparent)`, filter: 'blur(10px)' }} />

      <Link
        href={`/eventos/${event.id}`}
        className="relative flex flex-col rounded-[20px] overflow-hidden h-full"
        style={{
          background: 'linear-gradient(180deg,#111116 0%,#0c0c10 100%)',
          border: rank === 1
            ? `1px solid ${rc.accent}55`
            : '1px solid rgba(255,255,255,0.08)',
          boxShadow: rank === 1 ? `0 8px 32px ${rc.glow}20` : 'none',
          textDecoration: 'none',
        }}
      >
        {/* Colour top bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg,${rc.accent},${rc.accent}44,transparent)` }} />

        {/* Image */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <div className="absolute inset-0 z-[1]"
            style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,transparent 35%,rgba(12,12,16,0.85) 100%)' }} />

          {event.mediaType === 'video' && event.imageUrl ? (
            <video src={event.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" autoPlay muted loop playsInline />
          ) : event.imageUrl ? (
            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: '#1a1a1a' }}>
              <Calendar size={40} className="text-white/10" />
            </div>
          )}

          {/* Rank badge */}
          <div
            className={`absolute top-3 left-3 z-10 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-lg ${rc.badge}`}
            style={{ boxShadow: `0 4px 14px ${rc.glow}` }}
          >
            #{rank}
          </div>

          {/* DESTACADO badge */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            {hasPromo && (
              <div className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md"
                style={{ background: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.5)', color: '#fb923c' }}>
                <Zap size={7} style={{ display: 'inline', marginRight: 3 }} />Promo
              </div>
            )}
            <div className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md"
              style={{ background: `${rc.accent}20`, border: `1px solid ${rc.accent}55`, color: rc.accent }}>
              Destacado
            </div>
          </div>

          {/* Profile logo — fixed z-index so it's always on top */}
          {event.profileImageUrl && (
            <div className="absolute bottom-0 right-4 z-20" style={{ transform: 'translateY(50%)' }}>
              <div className="w-11 h-11 rounded-full overflow-hidden shadow-xl group-hover:scale-110 transition-transform duration-300"
                style={{ border: `2.5px solid #0c0c10`, background: '#111', boxShadow: `0 4px 14px rgba(0,0,0,0.6)` }}>
                <img src={event.profileImageUrl} alt="Logo" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow" style={{ paddingTop: event.profileImageUrl ? 22 : 16 }}>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              {event.venue && (
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: rc.accent }}>
                  {event.venue}
                </p>
              )}
              <h3 className="font-black text-base text-white leading-tight line-clamp-2 group-hover:text-[#8B5CF6] transition-colors" style={{ letterSpacing: '-0.01em' }}>
                {event.title}
              </h3>
            </div>
            {event.rating != null && (
              <div className="flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg text-xs font-black text-yellow-400"
                style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)' }}>
                <Star className="w-3 h-3 fill-yellow-400" />{event.rating}
              </div>
            )}
          </div>

          <div className="space-y-1.5 flex-grow mb-4">
            <div className="flex items-center gap-2 text-xs text-white/40 font-medium">
              <Calendar size={11} style={{ color: rc.accent, flexShrink: 0 }} />
              <span className="capitalize">{formatEventDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/30">
              <MapPin size={11} className="text-[#06B6D4] shrink-0" />
              <span className="line-clamp-1">{event.venue}{event.locality ? ` · ${event.locality}` : ''}</span>
            </div>
            {event.musicType && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${rc.accent}12`, color: rc.accent, border: `1px solid ${rc.accent}22` }}>
                <Music size={9} />{event.musicType}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={handleLike} disabled={isLiked}
              className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${isLiked ? 'text-[#EC4899]' : 'text-white/25 hover:text-[#EC4899]'}`}>
              <Heart className={`transition-colors ${isLiked ? 'fill-[#EC4899]' : ''}`} size={15} />
              <span>{localLikeCount}</span>
            </button>
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-[#8B5CF6] transition-colors">
              Ver detalles <ArrowUpRight size={10} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   COMPONENTE: EmptyState
══════════════════════════════════════════════ */
function EmptyState({ message, onClear }: { message: string; onClear?: () => void }) {
  return (
    <div className="text-center py-24 rounded-3xl"
      style={{ border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(14,14,14,0.5)' }}>
      <p className="text-white/30 text-sm font-medium mb-6">{message}</p>
      {onClear && (
        <button onClick={onClear} className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', color: '#fff', boxShadow: '0 4px 14px rgba(139,92,246,0.3)' }}>
          Ver todo
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   PAGE PRINCIPAL
══════════════════════════════════════════════ */
const SELECT_CLS = 'w-full appearance-none bg-[#0e0e0e] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#8B5CF6]/50 transition-all cursor-pointer [color-scheme:dark] hover:border-white/20';

export default function Home() {
  const { events, loading } = useEvents();
  const visitCount = useVisitCount();

  const { liked: featuredLikes, toggleLike: toggleFeaturedLike } = useLikes('jt');

  const [activeTab,     setActiveTab]     = useState<Tab>('evento');
  const [selectedZone,  setSelectedZone]  = useState('Todas');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [selectedDate,  setSelectedDate]  = useState('Todas');

  const clearFilters = useCallback(() => {
    setSelectedZone('Todas');
    setSelectedGenre('Todos');
    setSelectedDate('Todas');
  }, []);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    clearFilters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [clearFilters]);

  const currentData = useMemo(() => events.filter(e => e.category === activeTab), [events, activeTab]);

  const nightEvents = useMemo(() =>
    events.filter(e => e.category === 'evento' && !!e.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3),
    [events]);

  const topEventos = useMemo(() =>
    events.filter(e => e.category === 'evento' && Number(e.likes || 0) > 0)
      .sort((a, b) => Number(b.likes || 0) - Number(a.likes || 0))
      .slice(0, 3),
    [events]);

  const availableZones  = useMemo(() => { const z = currentData.map(e => e.locality).filter(Boolean) as string[]; return ['Todas', ...Array.from(new Set(z))]; }, [currentData]);
  const availableGenres = useMemo(() => { const g = currentData.map(e => e.musicType).filter(Boolean) as string[]; return ['Todos', ...Array.from(new Set(g))]; }, [currentData]);
  const availableDates  = useMemo(() => { const d = events.filter(e => e.category === 'evento').map(e => e.date?.split('T')[0]).filter(Boolean) as string[]; return ['Todas', ...Array.from(new Set(d)).sort()]; }, [events]);

  const filteredEvents = useMemo(() =>
    currentData.filter(e => {
      const zoneMatch  = selectedZone === 'Todas'  || e.locality === selectedZone;
      const genreMatch = selectedGenre === 'Todos' || e.musicType === selectedGenre;
      const dateMatch  = activeTab === 'bar' || selectedDate === 'Todas' || e.date?.startsWith(selectedDate);
      return zoneMatch && genreMatch && dateMatch;
    }),
    [currentData, selectedZone, selectedGenre, selectedDate, activeTab]);

  const hasFilters = selectedZone !== 'Todas' || selectedGenre !== 'Todos' || selectedDate !== 'Todas';

  /* Events with active promos — for BOTH eventos and bares */
  const eventsWithPromos = useMemo(
    () => events.filter(e => getActivePromos(e).length > 0),
    [events]
  );

  return (
    <main className="jt-home min-h-screen text-white font-sans overflow-x-hidden selection:bg-[#8B5CF6]/30">

      <PromoModal events={eventsWithPromos} />

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle,#8B5CF6,transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full opacity-[0.025]" style={{ background: 'radial-gradient(circle,#EC4899,transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* ── Nav — 3-column grid; minmax(0,1fr) allows columns to shrink below content ── */}
      <nav className="jt-nav w-full sticky top-0 z-50 backdrop-blur-2xl" style={{ background: 'rgba(5,5,5,0.92)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div
          className="jt-nav__inner max-w-7xl mx-auto px-4 sm:px-8 h-16"
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', alignItems: 'center' }}
        >
          {/* Left: Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div className="jt-brand-icon" style={{
              width: 30, height: 30, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg,#8B5CF6,#EC4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(139,92,246,0.4)',
              zIndex: 1,
            }}>
              <Zap size={15} color="#fff" />
            </div>
            {/* Text hidden on xs, visible from sm */}
            <span
              className="hidden sm:block font-black text-sm sm:text-base tracking-tight overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ textShadow: '0 0 20px rgba(139,92,246,0.5)', color: '#fff' }}
            >
              JODAS TUCUMANAS
            </span>
          </div>

          {/* Center: TabNav — always perfectly centred */}
          <TabNav activeTab={activeTab} onChange={handleTabChange} />

          {/* Right: visit count + contact */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minWidth: 0 }}>
            {visitCount > 0 && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white/25"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Eye size={11} />{visitCount.toLocaleString('es-AR')}
              </div>
            )}
            {/* Show full label on sm+, just icon on xs */}
            <Link
              href="/contacto"
              className="hidden sm:flex items-center px-3 sm:px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all text-white/40 hover:text-white whitespace-nowrap"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', textDecoration: 'none' }}
            >
              Contacto
            </Link>
            {/* Mobile: icon-only button */}
            <Link
              href="/contacto"
              className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full text-white/40 hover:text-white transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', textDecoration: 'none' }}
              title="Contacto"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="jt-hero relative z-10 max-w-4xl mx-auto text-center mt-16 sm:mt-24 mb-16 px-4">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
            <div className="jt-hero__eyebrow">
              <span className="jt-hero__pulse" />
              TUCUMÁN <span aria-hidden="true">/</span> PLANES PARA DESCUBRIR
            </div>
            <h1 className="jt-hero__title text-4xl sm:text-6xl md:text-7xl font-black mb-6 tracking-tight leading-[1.05]">
              {activeTab === 'evento' ? (
                <>La agenda <span style={{ color: '#8B5CF6', textShadow: '0 0 40px rgba(139,92,246,0.5)' }}>cultural</span> y nocturna<br className="hidden sm:block" /> de Tucumán.</>
              ) : (
                <>Directorio <span style={{ color: '#EC4899', textShadow: '0 0 40px rgba(236,72,153,0.5)' }}>exclusivo</span> de bares<br className="hidden sm:block" /> y gastronomía.</>
              )}
            </h1>
            <p className="jt-hero__description text-white/35 text-sm sm:text-base max-w-lg mx-auto font-medium leading-relaxed">
              {activeTab === 'evento'
                ? 'Encontrá los mejores eventos, recitales y fiestas. Filtrá por zona, género y fecha.'
                : 'Las mejores cervecerías, restobares y puntos de encuentro de la ciudad.'}
            </p>
            <div className="jt-hero__actions">
              <Link href="#cartelera" className="jt-hero__cta">
                {activeTab === 'evento' ? 'Explorar eventos' : 'Descubrir bares'}
                <ArrowUpRight size={16} />
              </Link>
              <span className="jt-hero__hint"><Zap size={13} /> Tucumán, de noche y de día</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="jt-home-content relative z-10 max-w-7xl mx-auto px-4 sm:px-8">

        {/* ── Promos Strip — siempre visible, ancla del modal ── */}
        {!loading && eventsWithPromos.length > 0 && (
          <PromoStrip events={eventsWithPromos} />
        )}

        {/* Agenda nocturna */}
        {activeTab === 'evento' && nightEvents.length > 0 && !loading && !hasFilters && (
          <section className="jt-section jt-night-section mb-24">
            <div className="jt-section-heading mb-8 flex items-end justify-between pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div style={{
                    width: 8, height: 28, borderRadius: 4,
                    background: 'linear-gradient(180deg,#8B5CF6,#EC4899)',
                    boxShadow: '0 0 10px rgba(236,72,153,0.4)',
                  }} />
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    La noche <span style={{ color: '#EC4899', textShadow: '0 0 20px rgba(236,72,153,0.5)' }}>tucumana</span>
                  </h2>
                </div>
                <p className="text-white/30 text-sm mt-1 ml-5">Fiestas y recitales próximos para armar tu salida.</p>
              </div>
              <span className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(236,72,153,0.06)', color: 'rgba(236,72,153,0.75)', border: '1px solid rgba(236,72,153,0.18)' }}>
                <Calendar size={11} /> Próximos eventos
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {nightEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* ── Eventos Destacados — MEJORADO ── */}
        {activeTab === 'evento' && topEventos.length > 0 && !loading && !hasFilters && (
          <section className="jt-section jt-featured-section mb-24">
            <div className="jt-section-heading mb-8 flex items-end justify-between pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div style={{
                    width: 8, height: 28, borderRadius: 4,
                    background: 'linear-gradient(180deg,#8B5CF6,#06B6D4)',
                    boxShadow: '0 0 10px rgba(6,182,212,0.4)',
                  }} />
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Eventos <span style={{ color: '#06B6D4', textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>Destacados</span>
                  </h2>
                </div>
                <p className="text-white/30 text-sm mt-1 ml-5">Las fechas que no te podés perder.</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(6,182,212,0.06)', color: 'rgba(6,182,212,0.6)', border: '1px solid rgba(6,182,212,0.18)' }}>
                <Star size={10} /> Top {topEventos.length}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topEventos.map((evt, i) => (
                <FeaturedCard key={evt.id} event={evt} rank={i + 1} index={i} isLiked={!!featuredLikes[evt.id]} onLike={toggleFeaturedLike} />
              ))}
            </div>
          </section>
        )}

        {/* Filtros */}
        <div className="jt-filters p-4 sm:p-5 rounded-2xl mb-12 flex flex-col lg:flex-row gap-4 items-center justify-between"
          style={{ background: 'rgba(14,14,14,0.6)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-2 text-white/30 font-black uppercase tracking-widest text-[10px] shrink-0">
            <Filter className="w-3.5 h-3.5" /><span>Filtros</span>
          </div>
          <div className="flex flex-col md:flex-row flex-wrap xl:flex-nowrap gap-3 w-full flex-1">
            {activeTab === 'evento' && (
              <div className="relative w-full md:flex-1 group">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B5CF6] w-4 h-4 pointer-events-none opacity-70" />
                <select aria-label="Filtrar por fecha" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={SELECT_CLS}>
                  {availableDates.map(d => <option key={d} value={d} className="bg-[#111] text-white/80">{formatShortDate(d)}</option>)}
                </select>
              </div>
            )}
            <div className="relative w-full md:flex-1 group">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#06B6D4] w-4 h-4 pointer-events-none opacity-70" />
              <select aria-label="Filtrar por zona" value={selectedZone} onChange={e => setSelectedZone(e.target.value)} className={SELECT_CLS}>
                {availableZones.map(z => <option key={z} value={z} className="bg-[#111] text-white/80">{z === 'Todas' ? 'Todas las zonas' : z}</option>)}
              </select>
            </div>
            <div className="relative w-full md:flex-1 group">
              <Music className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#EC4899] w-4 h-4 pointer-events-none opacity-70" />
              <select aria-label="Filtrar por género" value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)} className={SELECT_CLS}>
                {availableGenres.map(g => (
                  <option key={g} value={g} className="bg-[#111] text-white/80">
                    {g === 'Todos' ? (activeTab === 'bar' ? 'Todos los ambientes' : 'Todos los géneros') : g}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <AnimatePresence>
            {hasFilters && (
              <motion.button initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                onClick={clearFilters}
                className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white px-5 py-3 rounded-xl transition-all whitespace-nowrap w-full lg:w-auto justify-center bg-white/5 hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <FilterX size={14} /> Limpiar filtros
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Encabezado cartelera */}
        <div id="cartelera" className="jt-listing-heading mb-6 flex items-end justify-between pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {activeTab === 'evento' ? 'Cartelera General' : 'Directorio Gastronómico'}
          </h2>
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {filteredEvents.length} {filteredEvents.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin mb-4" size={32} style={{ color: '#8B5CF6' }} />
            <p className="text-white/30 text-sm font-medium tracking-wide">Cargando cartelera...</p>
          </div>
        ) : currentData.length === 0 ? (
          <EmptyState message="No hay publicaciones disponibles en esta sección." />
        ) : filteredEvents.length === 0 ? (
          <EmptyState message="No se encontraron resultados con los filtros actuales." onClear={clearFilters} />
        ) : (
          <div className="jt-event-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {filteredEvents.map((evt, i) => (
              <EventCard key={evt.id} event={evt} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="jt-footer max-w-7xl mx-auto pt-8 pb-12 flex flex-col md:flex-row items-center justify-between gap-5 text-xs px-4 sm:px-8 relative z-10"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-white/30 font-medium tracking-wide">
          © {new Date().getFullYear()} Jodas Tucumanas. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-6 font-bold uppercase tracking-widest text-[10px] text-white/30">
          <Link href="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link>
          <Link href="/contacto" className="hover:text-white transition-colors">Contacto</Link>
        </div>
      </footer>
    </main>
  );
}
