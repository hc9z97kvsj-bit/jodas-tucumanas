'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ArrowLeft, Share2, Heart, MapPin, Music, Calendar,
  Clock, Phone, Ticket, ExternalLink, Maximize2, X,
  Info, Loader2, AlertCircle, Star, Zap,
  ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react';

/* ── Íconos de redes sociales ── */
function IgIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function YtIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  );
}
function WaIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════ */

interface ScheduleDay { isOpen: boolean; open?: string; close?: string; }

interface PromoItem {
  url: string;
  mediaType: string;
  active?: boolean;
}

/* Formato nuevo que guarda el admin (campo "promotions") */
interface Promotion {
  id: string;
  url: string;
  mediaType: string;
  active: boolean;
}

interface EventData {
  id: string;
  category?: 'evento' | 'bar' | 'dj';
  title: string;
  venue?: string;
  imageUrl: string;
  profileImageUrl?: string;
  location?: string;
  locality?: string;
  location2?: string;
  locality2?: string;
  phone?: string;
  phone2?: string;
  date?: string;
  schedule?: Record<string, ScheduleDay>;
  musicType?: string;
  description?: string;
  rating?: number;
  likes?: number;
  mediaType?: string;
  instagram?: string;
  youtube?: string;
  ticketLink?: string;
  mapsLink?: string;
  /* Nuevo formato (admin actual) */
  promotions?: Promotion[];
  /* Legado — por compatibilidad con publicaciones antiguas */
  promoUrl?: string;
  promoMediaType?: string;
  promoActive?: boolean;
  promos?: PromoItem[];
}

/* ══════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════ */

function formatDate(dateStr: string) {
  if (!dateStr) return 'Fecha a confirmar';
  try {
    const [datePart, timePart] = dateStr.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const obj   = new Date(y, m - 1, d);
    const dias  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    let txt = `${dias[obj.getDay()]} ${d} de ${meses[m - 1]}`;
    if (timePart) { const [h, min] = timePart.split(':'); txt += ` — ${h}:${min} hs`; }
    return txt;
  } catch { return dateStr; }
}

function igHref(ig: string) { return ig.startsWith('http') ? ig : `https://instagram.com/${ig}`; }

/* ══════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════ */

const BG     = '#060608';
const CARD   = '#111116';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT   = '#f0f0f6';
const MUTED  = 'rgba(255,255,255,0.45)';
const PURPLE = '#9d6fff';
const PINK   = '#e040fb';
const CYAN   = '#22d3ee';
const GREEN  = '#4ade80';
const ORANGE = '#fb923c';

const CAT_CFG = {
  evento: { label: 'Evento',  color: PINK,   bg: 'rgba(224,64,251,0.12)',  border: 'rgba(224,64,251,0.28)'  },
  bar:    { label: 'Bar',     color: ORANGE, bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.28)'  },
  dj:     { label: 'DJ',      color: PURPLE, bg: 'rgba(157,111,255,0.12)', border: 'rgba(157,111,255,0.28)' },
} as const;

/* ══════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════ */

function InfoCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '20px 22px', ...style }}>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, color = MUTED, sub }: {
  icon: React.ElementType; label: string; value: string; color?: string; sub?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: MUTED, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, lineHeight: 1.35 }}>{value}</div>
        {sub && <div style={{ fontSize: 12.5, color: MUTED, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

function NavBtn({ icon: Icon, label, onClick, active, color }: {
  icon: React.ElementType; label: string; onClick: () => void; active?: boolean; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 42, height: 42, borderRadius: '50%',
        background: active ? `${color ?? PINK}22` : 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${active ? `${color ?? PINK}50` : 'rgba(255,255,255,0.12)'}`,
        color: active ? (color ?? PINK) : TEXT,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all .2s',
        pointerEvents: 'all' as const,
      }}
    >
      <Icon size={19} {...(active && label.includes('gusta') ? { fill: color ?? PINK } : {})} />
    </button>
  );
}

function CtaLink({ href, icon: Icon, label, variant = 'outline', color }: {
  href: string; icon: React.ElementType; label: string;
  variant?: 'primary' | 'outline' | 'whatsapp' | 'instagram'; color?: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: `linear-gradient(135deg,${PURPLE},${PINK})`, color: '#fff', border: 'none', boxShadow: `0 8px 28px ${PURPLE}40` },
    outline:   { background: CARD, border: `1px solid ${color ?? BORDER}`, color: color ?? TEXT },
    whatsapp:  { background: 'rgba(74,222,128,0.08)',  border: '1px solid rgba(74,222,128,0.25)',  color: GREEN },
    instagram: { background: 'rgba(224,64,251,0.07)',  border: '1px solid rgba(224,64,251,0.22)',  color: PINK  },
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, padding: '15px 22px', borderRadius: 16,
        fontWeight: 800, fontSize: 13.5,
        textTransform: 'uppercase' as const, letterSpacing: '0.07em',
        textDecoration: 'none', transition: 'all .2s',
        ...styles[variant],
      }}
    >
      <Icon size={19} /> {label}
    </a>
  );
}

/* ══════════════════════════════════════════════════════
   PROMO CAROUSEL COMPONENT
══════════════════════════════════════════════════════ */

function PromoCarousel({
  promos,
  title,
  catColor = PURPLE,
}: {
  promos: PromoItem[];
  title: string;
  catColor?: string;
}) {
  const [open,     setOpen]     = useState(true);
  const [idx,      setIdx]      = useState(0);
  const [fsPromo,  setFsPromo]  = useState<PromoItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const total = promos.length;
  const cur   = promos[idx] ?? promos[0];

  useEffect(() => {
    if (!open || isPaused || fsPromo || total <= 1) return;
    const timer = setInterval(() => {
      setIdx(prev => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(timer);
  }, [open, isPaused, fsPromo, total, idx]);

  if (!cur) return null;

  const prev = () => setIdx(i => (i - 1 + total) % total);
  const next = () => setIdx(i => (i + 1) % total);

  const sharePromo = () => {
    const msg = `¡Mirá esta promo de ${title}! ${typeof window !== 'undefined' ? window.location.href : ''}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  /* Derived colours from catColor */
  const colorAlpha = (a: number) => {
    const hex = catColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  };

  return (
    <>
      <style>{`
        @keyframes storyFill { 0% { width: 0%; } 100% { width: 100%; } }
        @keyframes promoPulse {
          0%, 100% { box-shadow: 0 0 0 0 ${colorAlpha(0.35)}; }
          50%       { box-shadow: 0 0 0 6px ${colorAlpha(0)}; }
        }
      `}</style>

      {/* ── Fullscreen overlay ── */}
      {fsPromo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ver promoción completa"
          onClick={() => setFsPromo(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, animation: 'fadeIn .18s ease',
          }}
        >
          <button
            onClick={() => setFsPromo(null)}
            aria-label="Cerrar pantalla completa"
            title="Cerrar (Esc)"
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', border: `1px solid ${BORDER}`,
              color: TEXT, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 10,
            }}
          >
            <X size={20} />
          </button>

          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 720, width: '100%', animation: 'scaleIn .2s ease' }}>
            {fsPromo.mediaType === 'video' ? (
              <video
                src={fsPromo.url} controls autoPlay
                style={{ width: '100%', borderRadius: 18, maxHeight: '80vh', objectFit: 'contain', background: '#000', display: 'block' }}
              />
            ) : (
              <img
                src={fsPromo.url} alt="Promoción"
                style={{ width: '100%', borderRadius: 18, maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
              />
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16 }}>
              <button
                onClick={sharePromo}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px', borderRadius: 12,
                  background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                  color: GREEN, fontWeight: 800, fontSize: 13, cursor: 'pointer',
                }}
              >
                <WaIcon size={16} /> Compartir por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inline promo card ── */}
      <div style={{ marginBottom: 14, animation: 'fadeUp .45s ease .26s both' }}>
        <div
          style={{
            background: `linear-gradient(135deg,${colorAlpha(0.07)},${colorAlpha(0.04)})`,
            border: `1px solid ${colorAlpha(0.32)}`,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: `0 4px 28px ${colorAlpha(0.1)}`,
          }}
        >
          {/* ── Header / toggle ── */}
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '14px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              textAlign: 'left' as const,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Pulsing icon badge */}
              <div
                style={{
                  width: 36, height: 36, borderRadius: 11,
                  background: `linear-gradient(135deg,${catColor},${colorAlpha(0.7)})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  animation: open ? 'promoPulse 2.4s ease-in-out infinite' : 'none',
                  boxShadow: `0 4px 16px ${colorAlpha(0.4)}`,
                }}
              >
                <Zap size={16} color="#fff" />
              </div>

              <div>
                <div
                  style={{
                    fontSize: 9, fontWeight: 900, textTransform: 'uppercase' as const,
                    letterSpacing: '0.18em', color: catColor, marginBottom: 2, opacity: 0.9,
                  }}
                >
                  {total > 1 ? `${total} Promociones` : 'Promoción disponible'}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: TEXT, lineHeight: 1.2 }}>
                  {total > 1 ? 'Tocá para navegar las promos' : 'Flyer promocional'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Dot counter badge */}
              {total > 1 && (
                <span
                  style={{
                    fontSize: 11, fontWeight: 800, color: catColor,
                    background: colorAlpha(0.14), border: `1px solid ${colorAlpha(0.28)}`,
                    borderRadius: 99, padding: '3px 9px', lineHeight: 1,
                  }}
                >
                  {idx + 1}/{total}
                </span>
              )}
              <ChevronDown
                size={18} color={MUTED}
                style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .3s ease', flexShrink: 0 }}
              />
            </div>
          </button>

          {/* ── Collapsible body ── */}
          <div
            style={{
              maxHeight: open ? '900px' : '0px',
              overflow: 'hidden',
              transition: 'max-height 0.45s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* ── Media stage ── */}
            <div
              style={{
                position: 'relative', width: '100%',
                height: 400, backgroundColor: '#050505', overflow: 'hidden',
                borderTop: `1px solid ${colorAlpha(0.16)}`,
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {/* Story-bar progress indicators */}
              {total > 1 && (
                <div
                  style={{
                    display: 'flex', gap: 4,
                    position: 'absolute', top: 12, left: 12, right: 12,
                    zIndex: 15, pointerEvents: 'none',
                  }}
                >
                  {promos.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1, height: 3,
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: 2, overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          background: catColor,
                          width: i < idx ? '100%' : '0%',
                          animation: (i === idx && !isPaused && open)
                            ? 'storyFill 5s linear forwards'
                            : 'none',
                          boxShadow: `0 0 6px ${colorAlpha(0.6)}`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Blurred background */}
              <div
                style={{
                  position: 'absolute', inset: -20,
                  backgroundImage: `url(${cur.url})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  filter: 'blur(28px)', opacity: 0.3, zIndex: 0,
                }}
              />
              {/* Subtle colour vignette */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(ellipse at center, transparent 55%, ${colorAlpha(0.12)} 100%)`,
                  zIndex: 1,
                }}
              />

              {/* Main media */}
              <div
                style={{
                  position: 'relative', width: '100%', height: '100%',
                  zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {cur.mediaType === 'video' ? (
                  <video
                    src={cur.url} autoPlay muted loop playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <img
                    src={cur.url} alt={`Promoción ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}
              </div>

              {/* Tap zones for navigation */}
              {total > 1 && (
                <>
                  <div
                    onClick={prev} aria-label="Anterior"
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '35%', zIndex: 10, cursor: 'pointer' }}
                  />
                  <div
                    onClick={next} aria-label="Siguiente"
                    style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '65%', zIndex: 10, cursor: 'pointer' }}
                  />
                </>
              )}

              {/* Arrow buttons (visible on hover) */}
              {total > 1 && (
                <>
                  <button
                    onClick={prev}
                    aria-label="Promo anterior"
                    style={{
                      position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                      zIndex: 12, width: 34, height: 34, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
                      border: `1px solid rgba(255,255,255,0.14)`,
                      color: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={next}
                    aria-label="Siguiente promo"
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      zIndex: 12, width: 34, height: 34, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
                      border: `1px solid rgba(255,255,255,0.14)`,
                      color: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {/* ── Dot indicators + action bar ── */}
            {total > 1 && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 6, padding: '10px 16px 0',
                }}
              >
                {promos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    aria-label={`Ver promoción ${i + 1}`}
                    style={{
                      width: i === idx ? 20 : 7,
                      height: 7, borderRadius: 99, border: 'none',
                      background: i === idx ? catColor : colorAlpha(0.3),
                      cursor: 'pointer', transition: 'all .25s ease',
                      padding: 0,
                      boxShadow: i === idx ? `0 0 8px ${colorAlpha(0.5)}` : 'none',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Footer toolbar */}
            <div
              style={{
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.25)',
                marginTop: total > 1 ? 10 : 0,
              }}
            >
              <button
                onClick={() => setFsPromo(cur)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', color: MUTED,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Maximize2 size={13} /> Pantalla completa
              </button>
              <button
                type="button"
                onClick={sharePromo}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px', borderRadius: 10,
                  background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.22)',
                  color: GREEN, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                }}
              >
                <WaIcon size={13} /> Compartir
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE COMPONENT
══════════════════════════════════════════════════════ */

export default function EventoDetalle() {
  const params = useParams();
  const router = useRouter();
  const id     = params?.id as string;

  const [event,      setEvent]      = useState<EventData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [liked,      setLiked]      = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (typeof window !== 'undefined') {
      setLiked(localStorage.getItem(`liked_jt_${id}`) === 'true');
    }
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const docRef  = doc(db, 'eventos', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as EventData;
          setEvent(data);
          setLikesCount(data.likes ?? 0);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Error al obtener evento:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleLike = async () => {
    if (liked || !event) return;
    setLiked(true);
    setLikesCount(p => p + 1);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`liked_jt_${event.id}`, 'true');
    }
    try {
      await updateDoc(doc(db, 'eventos', event.id), { likes: increment(1) });
    } catch {}
  };

  const handleShare = async () => {
    const url   = window.location.href;
    const title = event?.title ? `${event.title} — Tucumán Nocturno` : 'Tucumán Nocturno';
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: MUTED, fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <Loader2 size={36} style={{ color: PURPLE, animation: 'spin .8s linear infinite' }} />
      <span style={{ fontSize: 13, fontWeight: 600 }}>Cargando publicación…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (notFound || !event) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 18, color: TEXT, textAlign: 'center', padding: 32, fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <AlertCircle size={52} style={{ color: MUTED, opacity: .45 }} />
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Publicación no encontrada</div>
        <div style={{ fontSize: 14, color: MUTED }}>Es posible que haya sido eliminada o el enlace sea incorrecto.</div>
      </div>
      <button onClick={() => router.push('/')} aria-label="Volver al inicio" title="Volver al inicio"
        style={{ padding: '11px 22px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: TEXT, fontWeight: 700, fontSize: 14, border: `1px solid ${BORDER}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <ArrowLeft size={16} /> Volver a la cartelera
      </button>
    </div>
  );

  const isVideo  = event.mediaType === 'video' || event.imageUrl?.toLowerCase().endsWith('.mp4');
  const cat      = CAT_CFG[event.category ?? 'evento'];
  const hasPhone = !!(event.phone || event.phone2);
  const hasCta   = !!(event.ticketLink || event.instagram || hasPhone || event.youtube);

  /* ── Build promo list — works for evento, bar, and dj ──
     Priority order:
     1. event.promotions  → nuevo campo guardado por el admin actual (active promos only)
     2. event.promotions  → todos con URL aunque active sea false (igual se muestran)
     3. event.promos      → campo legado con array simple
     4. event.promoUrl    → campo legado con URL única                                */
  const fromPromotions: PromoItem[] = Array.isArray(event.promotions)
    ? event.promotions
        .filter(p => p.active && !!p.url)
        .map(p => ({ url: p.url, mediaType: p.mediaType }))
    : [];

  const fromPromotionsAll: PromoItem[] = Array.isArray(event.promotions)
    ? event.promotions
        .filter(p => !!p.url)
        .map(p => ({ url: p.url, mediaType: p.mediaType }))
    : [];

  const fromPromos: PromoItem[] = Array.isArray(event.promos)
    ? event.promos.filter(p => !!p.url)
    : [];

  const fromPromoUrl: PromoItem[] = event.promoUrl
    ? [{ url: event.promoUrl, mediaType: event.promoMediaType ?? 'image' }]
    : [];

  const promoList: PromoItem[] =
    fromPromotions.length > 0    ? fromPromotions    :
    fromPromotionsAll.length > 0 ? fromPromotionsAll :
    fromPromos.length > 0        ? fromPromos        :
    fromPromoUrl;

  const DAY_ORDER = [
    { key: 'lunes',     label: 'Lunes'     },
    { key: 'martes',    label: 'Martes'    },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves',    label: 'Jueves'    },
    { key: 'viernes',   label: 'Viernes'   },
    { key: 'sabado',    label: 'Sábado'    },
    { key: 'domingo',   label: 'Domingo'   },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'system-ui,-apple-system,sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @keyframes spin    { to   { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(.95); } to { opacity: 1; transform: scale(1); } }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(157,111,255,.3); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 99px; }
        a { text-decoration: none; }
      `}</style>

      {/* ── Fullscreen flyer ── */}
      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Flyer: ${event.title}`}
          onClick={() => setFullscreen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .18s ease' }}
        >
          <button onClick={() => setFullscreen(false)} aria-label="Cerrar pantalla completa" title="Cerrar (Esc)"
            style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: `1px solid ${BORDER}`, color: TEXT, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          >
            <X size={20} />
          </button>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 680, width: '100%', animation: 'scaleIn .2s ease' }}>
            {isVideo
              ? <video src={event.imageUrl} controls autoPlay style={{ width: '100%', borderRadius: 18, maxHeight: '88vh', objectFit: 'contain', background: '#000' }} />
              : <img src={event.imageUrl} alt={`Flyer: ${event.title}`} style={{ width: '100%', borderRadius: 18, maxHeight: '88vh', objectFit: 'contain', display: 'block' }} />
            }
            <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: MUTED, fontWeight: 600 }}>{event.title}</p>
          </div>
        </div>
      )}

      {/* ── Top nav ── */}
      <nav aria-label="Navegación" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, padding: '14px 18px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <NavBtn icon={ArrowLeft} label="Volver atrás" onClick={() => router.back()} />
          <div style={{ display: 'flex', gap: 8 }}>
            <NavBtn icon={Share2} label="Compartir publicación" onClick={handleShare} />
            <NavBtn icon={Heart}  label="Dar me gusta" onClick={handleLike} active={liked} color={PINK} />
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', width: '100%', height: '55vh', minHeight: 340, maxHeight: 520, background: '#0a0a0e', overflow: 'hidden' }}>
        {event.imageUrl && (
          isVideo
            ? <video src={event.imageUrl} autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .2, filter: 'blur(28px)', transform: 'scale(1.12)' }} />
            : <img src={event.imageUrl} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .2, filter: 'blur(28px)', transform: 'scale(1.12)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(6,6,8,.35) 0%,transparent 35%,transparent 52%,rgba(6,6,8,.95) 90%,#060608 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '68px 20px 48px', animation: 'fadeUp .4s ease' }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setFullscreen(true)}
            onKeyDown={e => e.key === 'Enter' && setFullscreen(true)}
            aria-label="Ver flyer a pantalla completa"
            title="Toca para ver a pantalla completa"
            style={{
              position: 'relative', cursor: 'zoom-in', borderRadius: 18, overflow: 'hidden',
              boxShadow: '0 28px 90px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.13)',
              maxWidth: event.category === 'bar' ? 310 : 225, width: '100%',
              aspectRatio: event.category === 'bar' ? '4/3' : '3/4',
            }}
          >
            {event.imageUrl ? (
              isVideo
                ? <video src={event.imageUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <img src={event.imageUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${cat.color}20,transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music size={40} style={{ color: cat.color, opacity: .35 }} />
              </div>
            )}
            <div
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(0,0,0,0.4)'; const h = el.querySelector('.fsh') as HTMLElement; if (h) h.style.opacity = '1'; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(0,0,0,0)';   const h = el.querySelector('.fsh') as HTMLElement; if (h) h.style.opacity = '0'; }}
            >
              <div className="fsh" style={{ opacity: 0, transition: 'opacity .18s', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', borderRadius: 11, padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 12.5, fontWeight: 700, pointerEvents: 'none' }}>
                <Maximize2 size={14} /> Pantalla completa
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 80px', position: 'relative', zIndex: 10 }}>

        {/* Title block */}
        <div style={{ marginTop: -2, marginBottom: 24, animation: 'fadeUp .45s ease .05s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13, flexWrap: 'wrap' as const }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: cat.bg, border: `1px solid ${cat.border}`, color: cat.color, padding: '4px 12px', borderRadius: 99, fontSize: 10.5, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
              {event.category === 'dj' ? <Music size={11} /> : event.category === 'bar' ? <Star size={11} /> : <Zap size={11} />}
              {cat.label}
            </span>
            {event.musicType && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.06)', color: MUTED, padding: '4px 11px', borderRadius: 99, fontSize: 10.5, fontWeight: 700 }}>
                <Music size={11} /> {event.musicType}
              </span>
            )}
            <button onClick={handleLike} disabled={liked}
              aria-label={`${liked ? 'Ya le diste me gusta' : 'Dar me gusta'} — ${likesCount}`}
              title={liked ? 'Ya le diste me gusta' : 'Dar me gusta'}
              style={{ display: 'flex', alignItems: 'center', gap: 5, color: liked ? PINK : MUTED, fontSize: 12.5, fontWeight: 700, marginLeft: 'auto', cursor: liked ? 'default' : 'pointer', background: 'none', border: 'none', padding: 0 }}
            >
              <Heart size={14} fill={liked ? PINK : 'none'} strokeWidth={2} /> {likesCount}
            </button>
          </div>
          <h1 style={{ fontSize: 'clamp(26px,7vw,44px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 11, color: TEXT }}>
            {event.title}
          </h1>
          {event.venue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {event.profileImageUrl && (
                <img src={event.profileImageUrl} alt={`Logo de ${event.venue}`} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${cat.color}55`, flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 18, fontWeight: 800, color: cat.color, opacity: .9 }}>{event.venue}</span>
            </div>
          )}
        </div>

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginBottom: 12, animation: 'fadeUp .45s ease .12s both' }}>
          {event.category === 'bar' && event.schedule ? (
            <InfoCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${ORANGE}18`, border: `1px solid ${ORANGE}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, flexShrink: 0 }}>
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: MUTED }}>Horarios</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Semana corriente</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DAY_ORDER.map(({ key, label }) => {
                  const data = event.schedule?.[key];
                  if (!data) return null;
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: data.isOpen ? TEXT : MUTED }}>{label}</span>
                      {data.isOpen
                        ? <span style={{ fontSize: 12, fontWeight: 600, color: ORANGE }}>{data.open} – {data.close}</span>
                        : <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(239,68,68,0.5)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Cerrado</span>
                      }
                    </div>
                  );
                })}
              </div>
            </InfoCard>
          ) : event.date ? (
            <InfoCard>
              <InfoRow icon={Calendar} label="Fecha y Hora" value={formatDate(event.date)} color={PURPLE} />
            </InfoCard>
          ) : null}

          {event.location && (
            <InfoCard style={{ height: 'fit-content' }}>
              <InfoRow icon={MapPin} label="Ubicación" value={event.location} sub={event.locality} color={CYAN} />
              {event.mapsLink && (
                <a href={event.mapsLink} target="_blank" rel="noopener noreferrer" aria-label="Abrir en Google Maps"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, marginLeft: 56, fontSize: 12.5, fontWeight: 700, color: CYAN }}>
                  Abrir en Google Maps <ExternalLink size={12} />
                </a>
              )}
            </InfoCard>
          )}

          {event.location2 && (
            <InfoCard style={{ height: 'fit-content' }}>
              <InfoRow icon={MapPin} label="Sucursal 2" value={event.location2} sub={event.locality2} color={CYAN} />
            </InfoCard>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div style={{ marginBottom: 12, animation: 'fadeUp .45s ease .2s both' }}>
            <InfoCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Info size={14} style={{ color: MUTED }} />
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: MUTED }}>Información adicional</span>
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.78, color: 'rgba(255,255,255,0.65)', whiteSpace: 'pre-line' }}>{event.description}</p>
            </InfoCard>
          </div>
        )}

        {/* Full-screen flyer button */}
        {event.imageUrl && (
          <div style={{ marginBottom: 14, animation: 'fadeUp .45s ease .24s both' }}>
            <button
              onClick={() => setFullscreen(true)}
              aria-label="Ver flyer a pantalla completa"
              title="Ver flyer a pantalla completa"
              style={{ width: '100%', padding: '13px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.1)', color: MUTED, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(157,111,255,0.08)'; el.style.color = PURPLE; el.style.borderColor = `${PURPLE}44`; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.025)'; el.style.color = MUTED; el.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              <Maximize2 size={16} /> Ver flyer a pantalla completa
            </button>
          </div>
        )}

        {/* ── PROMO CAROUSEL — shown for evento, bar, and dj ── */}
        {promoList.length > 0 && (
          <PromoCarousel
            promos={promoList}
            title={event.title}
            catColor={cat.color}
          />
        )}

        {/* CTA buttons */}
        {hasCta && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp .45s ease .28s both' }}>
            {event.ticketLink && (
              <CtaLink href={event.ticketLink} icon={Ticket} label="Comprar Entradas" variant="primary" />
            )}
            {event.phone && event.phone2 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <CtaLink href={`https://wa.me/${event.phone}`}  icon={Phone} label="Sucursal 1" variant="whatsapp" />
                <CtaLink href={`https://wa.me/${event.phone2}`} icon={Phone} label="Sucursal 2" variant="whatsapp" />
              </div>
            ) : event.phone ? (
              <CtaLink href={`https://wa.me/${event.phone}`} icon={Phone} label="Reservas / Consultas" variant="whatsapp" />
            ) : null}
            {event.instagram && (
              <CtaLink href={igHref(event.instagram)} icon={IgIcon} label="Ver en Instagram" variant="instagram" />
            )}
            {event.youtube && (
              <CtaLink href={event.youtube} icon={YtIcon} label="Ver en YouTube" variant="outline" color={MUTED} />
            )}
          </div>
        )}

        {!hasCta && (
          <div style={{ padding: '14px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: `1px solid ${BORDER}`, color: MUTED, fontSize: 13, fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Info size={14} /> Sin datos de contacto cargados
          </div>
        )}

        {/* Back button */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', animation: 'fadeUp .45s ease .33s both' }}>
          <button onClick={() => router.push('/')} aria-label="Volver a la cartelera" title="Volver"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: MUTED, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <ArrowLeft size={15} /> Volver a la cartelera
          </button>
        </div>
      </div>
    </div>
  );
}
