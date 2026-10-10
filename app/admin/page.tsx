'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  Plus, Save, Edit2, Trash2, LogOut, Search, RefreshCw,
  Inbox, Beer, PartyPopper, Clock, Eye, X, MapPin,
  LayoutGrid, Music, CalendarDays, Image, Link2, Phone,
  CheckCircle2, Loader2, Wand2, AlertCircle, Layers, BookOpen, FileText, BarChart3, Hash
} from 'lucide-react';

/* ══════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════ */

interface Schedule {
  isOpen: boolean;
  open: string;
  close: string;
}

// 👇 NUEVA INTERFAZ PARA MÚLTIPLES PROMOCIONES 👇
interface Promotion {
  id: string;
  url: string;
  mediaType: string;
  active: boolean;
}

interface EventData {
  id: string;
  category: 'evento' | 'bar';
  title: string;
  venue?: string;
  imageUrl: string;
  profileImageUrl?: string;
  location?: string;
  locality?: string;
  location2?: string;
  locality2?: string;
  phone2?: string;
  date?: string;
  schedule?: Record<string, Schedule>;
  musicType?: string;
  phone?: string;
  description?: string;
  rating?: number;
  mediaType?: string;
  ticketLink?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  mapsLink?: string;
  createdAt?: string;
  
  // Nuevo formato múltiple
  promotions?: Promotion[];
  
  // Mantengo las viejas como opcionales por compatibilidad con DB
  promoUrl?: string;
  promoMediaType?: string;
  promoActive?: boolean;
}

/* ══════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════ */

const LOCALIDADES = [
  'San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo', 'Alderetes',
  'Banda del Río Salí', 'Lules', 'Monteros', 'Concepción', 'Famaillá',
  'Tafí del Valle', 'Trancas', 'Burruyacú', 'Aguilares', 'La Cocha',
  'Simoca', 'Juan Bautista Alberdi', 'Las Talitas', 'El Manantial',
  'San Pablo', 'Santa Ana', 'San Javier', 'Raco', 'Amaicha del Valle',
  'Colalao del Valle', 'Interior / Otra',
];

const MUSIC_TYPES = ['Cuarteto', 'Cumbia', 'Electrónica', 'Reggaeton', 'Folklore', 'Rock', 'Pop', 'Tropical', 'Varios'];
const BAR_TYPES   = ['Cervecería', 'Restobar', 'Cocktail Bar', 'Pub / Música en vivo', 'Previa', 'Restorán'];

const DEFAULT_SCHEDULE: Record<string, Schedule> = {
  lunes:     { isOpen: false, open: '20:00', close: '03:00' },
  martes:    { isOpen: false, open: '20:00', close: '03:00' },
  miercoles: { isOpen: false, open: '20:00', close: '03:00' },
  jueves:    { isOpen: true,  open: '20:00', close: '03:00' },
  viernes:   { isOpen: true,  open: '20:00', close: '04:00' },
  sabado:    { isOpen: true,  open: '20:00', close: '04:00' },
  domingo:   { isOpen: false, open: '20:00', close: '03:00' },
};

const EMPTY_FORM: Omit<EventData, 'id'> = {
  category: 'evento',
  title: '', venue: '', imageUrl: '', profileImageUrl: '',
  location: '', locality: 'San Miguel de Tucumán',
  location2: '', locality2: 'Yerba Buena', phone2: '',
  date: '', schedule: { ...DEFAULT_SCHEDULE },
  musicType: 'Cuarteto', phone: '', description: '',
  rating: 5, mediaType: 'image',
  ticketLink: '', instagram: '', facebook: '', youtube: '', mapsLink: '',
  promotions: [], // Empezamos con un array vacío
};

/* ══════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════ */

const C = {
  bg:       '#070709',
  surface:  '#0f0f12',
  card:     '#14141a',
  border:   'rgba(255,255,255,0.07)',
  border2:  'rgba(255,255,255,0.12)',
  muted:    'rgba(255,255,255,0.35)',
  muted2:   'rgba(255,255,255,0.55)',
  text:     '#f0f0f5',
  purple:   '#9d6fff',
  pink:     '#e040fb',
  orange:   '#ff7043',
  amber:    '#ffb74d',
  cyan:     '#26c6da',
  green:    '#66bb6a',
  red:      '#ef5350',
};

const CAT = {
  evento: {
    label: 'Evento / Fiesta',
    Icon: PartyPopper,
    gradient: `linear-gradient(135deg, ${C.pink}, #f44336)`,
    accent: C.pink,
    accentFaint: 'rgba(224,64,251,0.12)',
    accentBorder: 'rgba(224,64,251,0.28)',
  },
  bar: {
    label: 'Bar / Previa',
    Icon: Beer,
    gradient: `linear-gradient(135deg, ${C.orange}, ${C.amber})`,
    accent: C.orange,
    accentFaint: 'rgba(255,112,67,0.12)',
    accentBorder: 'rgba(255,112,67,0.28)',
  },
} as const;

/* ══════════════════════════════════════════════════════
   SHARED STYLE OBJECTS
══════════════════════════════════════════════════════ */

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: 9, padding: '9px 13px',
  color: C.text, fontSize: 13, outline: 'none',
  transition: 'border-color 0.18s',
};

/* ══════════════════════════════════════════════════════
   UI ATOMS
══════════════════════════════════════════════════════ */

function Chip({ category }: { category: string }) {
  const c = CAT[category as keyof typeof CAT] ?? CAT.evento;
  const I = c.Icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: c.accentFaint, color: c.accent, border: `1px solid ${c.accentBorder}`, padding: '3px 10px 3px 7px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      <I size={11} /> {c.label.split('/')[0].trim()}
    </span>
  );
}

function SectionBlock({ icon: Icon, title, accent = C.purple, children }: { icon: React.ElementType; title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 15px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
          <Icon size={14} />
        </div>
        <span style={{ fontWeight: 800, fontSize: 12.5, color: C.text, letterSpacing: '0.01em' }}>{title}</span>
      </div>
      <div style={{ padding: 15 }}>{children}</div>
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 13 }}>{children}</div>;
}

function Field({ label, id, required, children }: { label: string; id: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, marginBottom: 6 }}>
        {label} {required && <span style={{ color: C.pink, fontSize: 11 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function IconBtn({ icon: Icon, label, color, bgHover, onClick, disabled = false, size = 30 }: { icon: React.ElementType; label: string; color: string; bgHover: string; onClick?: () => void; disabled?: boolean; size?: number }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: hov ? bgHover : 'transparent', border: 'none', color, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1, transition: 'background 0.15s, opacity 0.15s', flexShrink: 0 }}
    >
      <Icon size={14} />
    </button>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */

export default function AdminPage() {
  const router = useRouter();

  /* ── Auth ── */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  /* ── Events state ── */
  const [events, setEvents] = useState<EventData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState('');

  /* ── Form state ── */
  const [form, setForm] = useState<Omit<EventData, 'id'>>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [sinNumero, setSinNumero] = useState(false);
  const [showLoc2, setShowLoc2] = useState(false);

  /* ── Instagram scrape ── */
  const [igUrl, setIgUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState('');

  /* ── Preview modal ── */
  const [preview, setPreview] = useState<{ url: string; type: string } | null>(null);

  /* ── Table filters ── */
  const [search, setSearch] = useState('');
  const [formSearch, setFormSearch] = useState('');
  const [filterCat, setFilterCat] = useState<'all' | 'evento' | 'bar'>('all');
  const [mediaError, setMediaError] = useState('');

  /* ── Fetch Real desde Firestore ── */
  const fetchEvents = useCallback(async () => {
    setLoadingData(true);
    setDataError('');
    try {
      const q = query(collection(db, 'eventos'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => {
        const record = d.data();
        return {
          id: d.id,
          ...record,
          // Las publicaciones DJ que ya existían quedan visibles como eventos,
          // sin borrar ni modificar documentos en Firestore.
          category: record.category === 'bar' ? 'bar' : 'evento',
        };
      }) as EventData[];
      setEvents(data);
    } catch (error) {
      console.error(error);
      setDataError('No se pudieron cargar los eventos. Revisá tu conexión.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  /* ── Verificar Autenticación ── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        fetchEvents();
      } else {
        router.push('/login');
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router, fetchEvents]);

  /* ── Derived Stats ── */
  const stats = useMemo(() => ({
    total:   events.length,
    eventos: events.filter(e => e.category === 'evento').length,
    bares:   events.filter(e => e.category === 'bar').length,
  }), [events]);

  const filtered = useMemo(() =>
    events.filter(ev => {
      const matchCat = filterCat === 'all' || ev.category === filterCat;
      const t = search.toLowerCase();
      return matchCat && (!t || ev.title.toLowerCase().includes(t) || (ev.venue ?? '').toLowerCase().includes(t) || (ev.locality ?? '').toLowerCase().includes(t));
    }),
  [events, filterCat, search]);

  const formSearchResults = useMemo(() => {
    const terms = formSearch.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return events
      .filter(ev => {
        const haystack = [
          ev.title, ev.venue, ev.locality, ev.location, ev.musicType,
          ev.phone, ev.instagram, ev.facebook, ev.youtube, ev.mapsLink,
        ].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
        return terms.every(term => haystack.includes(term.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
      })
      .slice(0, 10);
  }, [events, formSearch]);

  const selectedRecord = useMemo(
    () => editingId ? events.find(ev => ev.id === editingId) ?? null : null,
    [editingId, events],
  );

  const currentCat = (form.category as keyof typeof CAT) in CAT ? form.category as keyof typeof CAT : 'evento';
  const cat = CAT[currentCat];

  /* ── Handlers de Campos Básicos ── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const clean = (name === 'imageUrl' || name === 'profileImageUrl') ? value.replace(/\[\/?img\]/gi, '').trim() : value;
    if (name === 'imageUrl') {
      const path = clean.toLowerCase().split(/[?#]/, 1)[0];
      const mediaType = /\.(mp4|m4v|webm|mov|ogv)$/.test(path) ? 'video' : 'image';
      setForm(p => ({ ...p, imageUrl: clean, mediaType }));
      setMediaError('');
    } else {
      setForm(p => ({ ...p, [name]: clean }));
    }
  };

  const handleSchedule = (day: string, field: string, value: string | boolean) => {
    setForm(p => ({ ...p, schedule: { ...p.schedule, [day]: { ...p.schedule![day], [field]: value } } }));
  };

  /* ── Handlers de PROMOCIONES MÚLTIPLES ── */
  const addPromotion = () => {
    setForm(p => ({
      ...p,
      promotions: [
        ...(p.promotions || []),
        { id: Date.now().toString(), url: '', mediaType: 'image', active: true }
      ]
    }));
  };

  const updatePromotion = (id: string, field: keyof Promotion, value: any) => {
    setForm(p => ({
      ...p,
      promotions: p.promotions?.map(promo => promo.id === id ? { ...promo, [field]: value } : promo)
    }));
  };

  const removePromotion = (id: string) => {
    setForm(p => ({
      ...p,
      promotions: p.promotions?.filter(promo => promo.id !== id)
    }));
  };

  /* ── Reset y Submit ── */
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormSearch('');
    setMediaError('');
    setSuccessMsg('');
    setSinNumero(false);
    setShowLoc2(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !events.some(event => event.id === editingId)) {
      setMediaError('Primero buscá y seleccioná una ficha de la base de datos.');
      return;
    }
    if (!form.imageUrl.trim()) {
      setMediaError('Pegá el enlace del flyer o video antes de guardar.');
      return;
    }

    setIsSubmitting(true);
    setMediaError('');
    try {
      const mediaUpdate = {
        imageUrl: form.imageUrl.trim(),
        mediaType: form.mediaType || 'image',
      };
      await updateDoc(doc(db, 'eventos', editingId), mediaUpdate);
      setEvents(current => current.map(event =>
        event.id === editingId ? { ...event, ...mediaUpdate } : event
      ));
      setForm(current => ({ ...current, ...mediaUpdate }));
      setSuccessMsg(`Flyer/video actualizado para “${events.find(event => event.id === editingId)?.title ?? 'la ficha'}”.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setMediaError('No se pudo actualizar el flyer o video. Revisá tu conexión e intentá otra vez.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadIntoForm = (ev: EventData) => {
    const { id, ...rest } = ev;
    setForm({
      ...EMPTY_FORM,
      ...rest,
      imageUrl: '',
      mediaType: ev.mediaType || 'image',
    });
    setEditingId(id);
    setFormSearch('');
    setMediaError('');
    setSuccessMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`¿Eliminar "${title}" permanentemente?`)) return;
    try {
      await deleteDoc(doc(db, 'eventos', id));
      fetchEvents();
    } catch (err) {
      console.error(err);
      alert('Hubo un error al eliminar.');
    }
  };

  const handleAutoFill = async () => {
    if (!igUrl || !igUrl.includes('instagram.com')) {
      setScrapeError('Ingresá un link válido de Instagram.');
      return;
    }
    setIsScraping(true);
    setScrapeError('');
    try {
      const res = await fetch('/api/instagram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: igUrl }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const mediaUrl = data?.data?.videoUrl ?? data?.data?.imageUrl ?? '';
      const desc = data?.data?.caption ?? '';
      if (!mediaUrl) { setScrapeError('Formato de respuesta no reconocido.'); return; }
      setForm(p => ({ ...p, imageUrl: mediaUrl, description: desc || p.description, instagram: igUrl }));
      setIgUrl('');
    } catch {
      setScrapeError('Error de conexión o perfil privado.');
    } finally {
      setIsScraping(false);
    }
  };

  const fmtDate = (d: string) => {
    if (!d) return '—';
    try {
      const [date] = d.split('T');
      const [y, m, day] = date.split('-');
      const obj = new Date(Number(y), Number(m) - 1, Number(day));
      const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
      return `${dias[obj.getDay()]} ${day}/${m}`;
    } catch { return d; }
  };

  const fmtDateTime = (d: string) => {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return fmtDate(d);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(date);
  };

  const selectedFacts = selectedRecord ? [
    { label: 'Nombre de fiesta', value: selectedRecord.title },
    { label: 'Lugar / boliche', value: selectedRecord.venue ?? '' },
    { label: 'Fecha', value: selectedRecord.category === 'bar' ? 'Horarios semanales' : fmtDateTime(selectedRecord.date ?? '') },
    { label: 'Dirección', value: [selectedRecord.location, selectedRecord.locality].filter(Boolean).join(' · ') },
    { label: 'Género / tipo', value: selectedRecord.musicType ?? '' },
    { label: 'WhatsApp', value: selectedRecord.phone ?? '' },
    { label: 'WhatsApp sucursal 2', value: selectedRecord.phone2 ?? '' },
    { label: 'Instagram', value: selectedRecord.instagram ?? '' },
    { label: 'Facebook', value: selectedRecord.facebook ?? '' },
    { label: 'YouTube', value: selectedRecord.youtube ?? '' },
    { label: 'Google Maps', value: selectedRecord.mapsLink ?? '' },
    { label: 'Link de entradas', value: selectedRecord.ticketLink ?? '' },
    { label: 'Segunda dirección', value: [selectedRecord.location2, selectedRecord.locality2].filter(Boolean).join(' · ') },
  ].filter(item => item.value && item.value !== '—') : [];

  /* ══════════════════════════════════════════════════════
     LOADING / AUTH
  ══════════════════════════════════════════════════════ */

  if (loadingAuth) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: C.muted, fontSize: 14 }}>
      <Loader2 size={22} style={{ animation: 'spin .8s linear infinite', color: C.purple }} />
      Verificando sesión...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!isAuthenticated) return null;

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        input:focus,select:focus,textarea:focus{border-color:${C.purple} !important}
        input[type=time]::-webkit-calendar-picker-indicator{filter:invert(.6)}
        input[type=datetime-local]::-webkit-calendar-picker-indicator{filter:invert(.6)}
        ::placeholder{color:rgba(255,255,255,0.22)}
        select option{background:${C.card}}
        .admin-media-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
        @media(max-width:640px){.admin-media-facts{grid-template-columns:1fr}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
      `}</style>

      {/* Preview modal */}
      {preview && (
        <div role="dialog" aria-modal="true" aria-label="Vista previa" onClick={() => setPreview(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: 540, width: '100%', animation: 'fadeIn .2s ease' }}>
            <button onClick={() => setPreview(null)} title="Cerrar" aria-label="Cerrar vista previa"
              style={{ position: 'absolute', top: -44, right: 0, width: 36, height: 36, borderRadius: '50%', background: C.card, border: `1px solid ${C.border}`, color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
            {preview.type === 'video'
              ? <video src={preview.url} controls autoPlay style={{ width: '100%', borderRadius: 14, maxHeight: '80vh' }} />
              : <img src={preview.url} alt="Vista previa" style={{ width: '100%', borderRadius: 14, maxHeight: '80vh', objectFit: 'contain', background: '#000' }} />
            }
          </div>
        </div>
      )}

      {/* ── TOPBAR ── */}
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, height: 58, padding: '0 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${C.pink},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Layers size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: '-0.025em', color: C.text }}>Tucumán Nocturno</div>
            <div style={{ fontSize: 9.5, color: C.muted, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Panel de Administración</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={fetchEvents}
            title="Recargar eventos"
            aria-label="Recargar eventos desde Firestore"
            style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.muted2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RefreshCw size={14} style={{ animation: loadingData ? 'spin .8s linear infinite' : 'none' }} />
          </button>
          
          <Link href="/admin/solicitudes" aria-label="Ver solicitudes"
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 9, background: CAT.evento.accentFaint, border: `1px solid ${CAT.evento.accentBorder}`, color: C.pink, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            <Inbox size={13} /> Solicitudes
          </Link>
          <button
            type="button"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            onClick={() => { signOut(auth).then(() => router.push('/')) }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 9, background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.2)', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <LogOut size={13} /> Salir
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 18px 64px' }}>

        {/* ── STATS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 11, marginBottom: 22 }}>
          {([
            { label: 'Total',   value: stats.total,   icon: BarChart3,    color: C.purple },
            { label: 'Eventos', value: stats.eventos, icon: PartyPopper,  color: C.pink   },
            { label: 'Bares',   value: stats.bares,   icon: Beer,         color: C.orange },
          ] as const).map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: '15px 17px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                <Icon size={17} />
              </div>
              <div>
                {loadingData
                  ? <div style={{ width: 28, height: 22, background: 'rgba(255,255,255,0.06)', borderRadius: 5, animation: 'pulse 1.4s ease infinite' }} />
                  : <div style={{ fontSize: 25, fontWeight: 900, color: C.text, lineHeight: 1 }}>{value}</div>
                }
                <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 600, marginTop: 3 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ════ BUSCADOR Y ACTUALIZADOR DE MULTIMEDIA ════ */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, marginBottom: 18, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(157,111,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.purple }}>
                <Search size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: C.text }}>Buscar ficha en la base de datos</div>
                <div style={{ fontSize: 11, color: C.muted }}>Los datos se cargan desde Firestore; solo vas a cambiar el flyer o video.</div>
              </div>
            </div>
            {selectedRecord && (
              <button type="button" onClick={resetForm} title="Elegir otra ficha" aria-label="Elegir otra ficha"
                style={{ padding: '7px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.muted2, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Cambiar ficha
              </button>
            )}
          </div>

          {!selectedRecord ? (
            <div style={{ padding: 20 }}>
              <label htmlFor="databaseSearch" style={{ display: 'block', marginBottom: 8, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted }}>
                Nombre de fiesta, boliche, dirección o localidad
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.purple, pointerEvents: 'none' }} />
                <input
                  id="databaseSearch"
                  type="search"
                  value={formSearch}
                  onChange={e => setFormSearch(e.target.value)}
                  placeholder="Ej.: Serna, Yerba Buena, San Martín..."
                  aria-label="Buscar fiestas y lugares en Firestore"
                  style={{ ...inp, padding: '12px 14px 12px 40px', fontSize: 13 }}
                />
              </div>

              {loadingData ? (
                <div style={{ padding: '25px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, color: C.muted, fontSize: 12 }}>
                  <Loader2 size={16} style={{ animation: 'spin .8s linear infinite', color: C.purple }} /> Cargando fichas guardadas…
                </div>
              ) : dataError ? (
                <p role="alert" style={{ margin: '14px 0 0', color: C.red, fontSize: 12 }}>{dataError}</p>
              ) : formSearch.trim().length < 2 ? (
                <p style={{ margin: '11px 2px 0', color: C.muted, fontSize: 11.5 }}>
                  Escribí al menos 2 caracteres para buscar entre {events.length} fichas.
                </p>
              ) : formSearchResults.length === 0 ? (
                <div style={{ marginTop: 14, padding: 16, borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`, color: C.muted2, fontSize: 12 }}>
                  No encontramos una ficha con ese dato. Este formulario actualiza fichas existentes; no crea publicaciones nuevas.
                </div>
              ) : (
                <div role="listbox" aria-label="Resultados de la búsqueda" style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 14 }}>
                  {formSearchResults.map(ev => (
                    <button
                      key={ev.id}
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => loadIntoForm(ev)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 13px', textAlign: 'left', borderRadius: 11, background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`, color: C.text, cursor: 'pointer', transition: 'border-color .15s,background .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(157,111,255,0.42)'; e.currentTarget.style.background = 'rgba(157,111,255,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                    >
                      {ev.imageUrl ? (
                        <img src={ev.imageUrl} alt="" aria-hidden="true" style={{ width: 42, height: 42, borderRadius: 9, objectFit: 'cover', flexShrink: 0, background: C.surface }} />
                      ) : (
                        <div aria-hidden="true" style={{ width: 42, height: 42, borderRadius: 9, flexShrink: 0, display: 'grid', placeItems: 'center', color: C.purple, background: 'rgba(157,111,255,0.1)' }}>
                          {ev.category === 'bar' ? <Beer size={17} /> : <PartyPopper size={17} />}
                        </div>
                      )}
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: 'block', overflow: 'hidden', color: C.text, fontSize: 12.5, fontWeight: 800, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                        <span style={{ display: 'block', overflow: 'hidden', marginTop: 3, color: C.muted, fontSize: 11, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {[ev.venue, ev.locality, ev.location].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                        <Chip category={ev.category} />
                        <span style={{ color: C.muted, fontSize: 10 }}>{ev.category === 'bar' ? 'Bar' : fmtDate(ev.date ?? '')}</span>
                      </span>
                    </button>
                  ))}
                  <span style={{ color: C.muted, fontSize: 10.5, padding: '2px 3px' }}>Mostrando hasta 10 coincidencias. Afiná la búsqueda si no aparece la ficha.</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: 14, borderRadius: 12, background: 'rgba(157,111,255,0.055)', border: '1px solid rgba(157,111,255,0.16)' }}>
                {selectedRecord.imageUrl ? (
                  <img src={selectedRecord.imageUrl} alt="" aria-hidden="true" style={{ width: 52, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: C.surface }} />
                ) : (
                  <div aria-hidden="true" style={{ width: 52, height: 64, borderRadius: 8, flexShrink: 0, display: 'grid', placeItems: 'center', color: C.purple, background: C.surface }}>
                    {selectedRecord.category === 'bar' ? <Beer size={19} /> : <PartyPopper size={19} />}
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                    <Chip category={selectedRecord.category} />
                    <span style={{ color: C.green, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Ficha cargada desde Firestore</span>
                  </div>
                  <div style={{ color: C.text, fontSize: 15, fontWeight: 900, overflowWrap: 'anywhere' }}>{selectedRecord.title}</div>
                  <div style={{ marginTop: 3, color: C.muted2, fontSize: 11.5 }}>{selectedRecord.venue || selectedRecord.locality || 'Sin lugar especificado'}</div>
                </div>
                {selectedRecord.imageUrl && (
                  <IconBtn icon={Eye} label="Ver flyer o video actual" color={C.cyan} bgHover="rgba(38,198,218,0.12)" onClick={() => setPreview({ url: selectedRecord.imageUrl, type: selectedRecord.mediaType ?? 'image' })} size={34} />
                )}
              </div>

              <div className="admin-media-facts" style={{ gap: 8, marginBottom: 18 }}>
                {selectedFacts.map(fact => (
                  <div key={fact.label} style={{ minWidth: 0, padding: '10px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.022)', border: `1px solid ${C.border}` }}>
                    <div style={{ marginBottom: 4, color: C.muted, fontSize: 9, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{fact.label}</div>
                    <div style={{ color: C.muted2, fontSize: 11.5, lineHeight: 1.45, overflowWrap: 'anywhere' }}>{fact.value}</div>
                  </div>
                ))}
                {selectedFacts.length === 0 && <div style={{ color: C.muted, fontSize: 12 }}>La ficha no tiene otros datos guardados.</div>}
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                <Field label="Link nuevo del flyer o video" id="databaseMediaUrl" required>
                  <input id="databaseMediaUrl" name="imageUrl" type="url" required value={form.imageUrl} onChange={handleChange} placeholder="Pegá una URL directa del flyer o video…" aria-required="true" style={{ ...inp, minHeight: 44 }} />
                </Field>
                <span style={{ marginTop: -5, color: C.muted, fontSize: 10.5 }}>
                  El tipo se detecta automáticamente por la extensión del enlace (por ejemplo, .mp4 para video).
                </span>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 9, color: C.muted2, background: 'rgba(38,198,218,0.05)', border: '1px solid rgba(38,198,218,0.12)', fontSize: 11, lineHeight: 1.5 }}>
                  <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1, color: C.cyan }} />
                  Al guardar solo se actualizarán <strong style={{ color: C.text }}>el link y el tipo de multimedia</strong>. Nombre, fecha, dirección y contactos permanecen como están en la base.
                </div>

                {mediaError && <p role="alert" style={{ margin: 0, color: C.red, fontSize: 12 }}>{mediaError}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button type="submit" disabled={isSubmitting || !form.imageUrl.trim()}
                    title="Guardar nuevo flyer o video"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 17px', borderRadius: 10, background: `linear-gradient(135deg,${C.purple},${C.pink})`, color: '#fff', fontWeight: 800, fontSize: 12.5, border: 'none', cursor: isSubmitting || !form.imageUrl.trim() ? 'not-allowed' : 'pointer', opacity: isSubmitting || !form.imageUrl.trim() ? 0.55 : 1, boxShadow: '0 4px 18px rgba(0,0,0,0.35)' }}>
                    {isSubmitting ? <Loader2 size={15} style={{ animation: 'spin .8s linear infinite' }} /> : <Save size={15} />}
                    {isSubmitting ? 'Guardando…' : 'Actualizar flyer / video'}
                  </button>
                  {successMsg && <span role="status" style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.green, fontSize: 12, fontWeight: 700 }}><CheckCircle2 size={14} />{successMsg}</span>}
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Formulario anterior, conservado oculto para mantener compatibilidad visual. */}
        <div hidden aria-hidden="true" style={{ display: 'none', background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, marginBottom: 18 }}>

          {/* Form header */}
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: editingId ? 'rgba(38,198,218,0.12)' : 'rgba(157,111,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: editingId ? C.cyan : C.purple }}>
                {editingId ? <Edit2 size={15} /> : <Plus size={15} />}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: C.text }}>{editingId ? 'Editando publicación' : 'Nueva publicación'}</div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {editingId ? `ID: ${editingId}` : 'Completá los campos para publicar en el directorio'}
                </div>
              </div>
            </div>
            {editingId && (
              <button type="button" onClick={resetForm} title="Cancelar edición" aria-label="Cancelar edición"
                style={{ padding: '6px 13px', borderRadius: 8, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Cancelar
              </button>
            )}
          </div>

          {/* Category selector */}
          <div style={{ padding: '18px 22px 0' }}>
            <div role="group" aria-label="Categoría de publicación" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 7, background: C.surface, padding: 5, borderRadius: 12, border: `1px solid ${C.border}` }}>
              {(['evento','bar'] as const).map(c => {
                const cc = CAT[c];
                const active = form.category === c;
                const I = cc.Icon;
                return (
                  <button key={c} type="button"
                    aria-pressed={active}
                    aria-label={`Categoría: ${cc.label}`}
                    title={`Seleccionar: ${cc.label}`}
                    onClick={() => setForm(p => ({ ...p, category: c }))}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0', borderRadius: 9, fontWeight: 800, fontSize: 12.5, background: active ? cc.gradient : 'transparent', color: active ? '#fff' : C.muted, border: 'none', cursor: 'pointer', boxShadow: active ? '0 4px 18px rgba(0,0,0,0.35)' : 'none', transition: 'all .2s' }}>
                    <I size={14} /> {cc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* IG autofill */}
          <div style={{ margin: '16px 22px 0', padding: '14px 16px', borderRadius: 12, background: CAT.evento.accentFaint, border: `1px solid ${CAT.evento.accentBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, fontSize: 12.5, fontWeight: 800, color: C.pink }}>
                <Wand2 size={14} /> Autocompletar desde Instagram
              </div>
              <div style={{ display: 'flex', gap: 9 }}>
                <label htmlFor="igUrl" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>URL de Instagram</label>
                <input id="igUrl" type="url" value={igUrl} onChange={e => setIgUrl(e.target.value)} placeholder="https://www.instagram.com/p/..." aria-label="URL de publicación de Instagram" style={{ ...inp, flexGrow: 1 }} />
                <button type="button" onClick={handleAutoFill} disabled={isScraping || !igUrl}
                  title="Extraer flyer" aria-label="Extraer flyer de Instagram"
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 17px', borderRadius: 9, background: `linear-gradient(135deg,${C.pink},${C.purple})`, color: '#fff', fontWeight: 800, fontSize: 12, border: 'none', cursor: isScraping || !igUrl ? 'not-allowed' : 'pointer', opacity: isScraping || !igUrl ? 0.55 : 1, whiteSpace: 'nowrap' }}>
                  {isScraping ? <Loader2 size={13} style={{ animation: 'spin .8s linear infinite' }} /> : <Wand2 size={13} />}
                  Extraer
                </button>
              </div>
              {scrapeError && <p role="alert" style={{ margin: '8px 0 0', fontSize: 12, color: C.red, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={13} />{scrapeError}</p>}
            </div>

          {/* ── FORM ── */}
          <form onSubmit={handleSubmit} style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 13 }}>

            <>
                <SectionBlock icon={FileText} title="Información Básica" accent={cat.accent}>
                  <FieldRow>
                    <Field label={form.category === 'bar' ? 'Nombre del Bar / Local' : 'Nombre del Evento / Fiesta'} id="title" required>
                      <input id="title" name="title" required type="text" value={form.title} onChange={handleChange} placeholder={form.category === 'bar' ? 'Ej: Antares Tucumán' : 'Ej: El Cumbión 2025'} aria-required="true" style={inp} />
                    </Field>
                    <Field label={form.category === 'bar' ? 'Subtítulo (Ej: Cervecería)' : 'Lugar / Boliche'} id="venue">
                      <input id="venue" name="venue" type="text" value={form.venue ?? ''} onChange={handleChange} placeholder={form.category === 'bar' ? 'Ej: Cervecería Artesanal' : 'Ej: Jungle Club'} style={inp} />
                    </Field>
                  </FieldRow>
                </SectionBlock>

                <SectionBlock icon={MapPin} title="Ubicación Principal" accent={C.cyan}>
                  <FieldRow>
                    <Field label="Localidad / Zona" id="locality">
                      <select id="locality" name="locality" value={form.locality} onChange={handleChange} title="Localidad" aria-label="Localidad o zona" style={{ ...inp, colorScheme: 'dark' }}>
                        {LOCALIDADES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </Field>
                    <Field label="Dirección exacta" id="location" required>
                      <input id="location" name="location" required type="text" value={form.location ?? ''} onChange={handleChange} placeholder="Ej: 24 de Septiembre 1326" aria-required="true" style={inp} />
                    </Field>
                  </FieldRow>
                </SectionBlock>

                {/* Segunda sucursal (bares) */}
                {form.category === 'bar' && (
                  <div style={{ borderRadius: 12, border: showLoc2 ? `1px solid ${CAT.bar.accentBorder}` : `1px dashed ${C.border}`, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 15px', background: showLoc2 ? CAT.bar.accentFaint : 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: showLoc2 ? C.orange : C.muted, fontWeight: 700, fontSize: 12.5 }}>
                        <MapPin size={13} /> Segunda Sucursal <span style={{ fontWeight: 500, fontSize: 11 }}>(opcional)</span>
                      </div>
                      <button type="button" onClick={() => setShowLoc2(p => !p)}
                        title={showLoc2 ? 'Quitar segunda sucursal' : 'Agregar segunda sucursal'}
                        aria-label={showLoc2 ? 'Quitar segunda sucursal' : 'Agregar segunda sucursal'}
                        aria-expanded={showLoc2}
                        style={{ padding: '4px 11px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: showLoc2 ? 'rgba(239,83,80,0.1)' : CAT.bar.accentFaint, color: showLoc2 ? C.red : C.orange, border: 'none', cursor: 'pointer' }}>
                        {showLoc2 ? 'Quitar' : '+ Agregar'}
                      </button>
                    </div>
                    {showLoc2 && (
                      <div style={{ padding: '0 15px 15px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 13 }}>
                          <Field label="Localidad 2" id="locality2">
                            <select id="locality2" name="locality2" value={form.locality2} onChange={handleChange} title="Segunda localidad" aria-label="Segunda localidad" style={{ ...inp, colorScheme: 'dark' }}>
                              {LOCALIDADES.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </Field>
                          <Field label="Dirección 2" id="location2">
                            <input id="location2" name="location2" type="text" value={form.location2 ?? ''} onChange={handleChange} placeholder="Ej: Av. Perón 1500" style={inp} />
                          </Field>
                          <div style={{ gridColumn: '1/-1' }}>
                            <Field label="WhatsApp Sucursal 2" id="phone2">
                              <input id="phone2" name="phone2" type="text" value={form.phone2 ?? ''} onChange={handleChange} placeholder="5493810000000" style={inp} />
                            </Field>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fecha / Horarios */}
                {form.category === 'evento' ? (
                  <SectionBlock icon={CalendarDays} title="Fecha y Música" accent={C.purple}>
                    <FieldRow>
                      <Field label="Fecha y Hora" id="date" required>
                        <input id="date" name="date" required type="datetime-local" value={form.date ?? ''} onChange={handleChange} title="Fecha y hora del evento" aria-label="Fecha y hora del evento" aria-required="true" style={{ ...inp, colorScheme: 'dark' }} />
                      </Field>
                      <Field label="Tipo de Música" id="musicType">
                        <select id="musicType" name="musicType" value={form.musicType} onChange={handleChange} title="Tipo de música" aria-label="Tipo de música" style={{ ...inp, colorScheme: 'dark' }}>
                          {MUSIC_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </Field>
                    </FieldRow>
                  </SectionBlock>
                ) : (
                  <SectionBlock icon={Clock} title="Horarios Semanales" accent={C.orange}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Días desmarcados se muestran como "Cerrado".</p>
                      <select value={form.musicType} onChange={handleChange} name="musicType" title="Tipo de establecimiento" aria-label="Tipo de establecimiento" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 9px', fontSize: 11, color: C.text, colorScheme: 'dark' }}>
                        {BAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 7 }}>
                      {Object.keys(form.schedule ?? DEFAULT_SCHEDULE).map(day => {
                        const d = (form.schedule ?? DEFAULT_SCHEDULE)[day];
                        return (
                          <div key={day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 9, background: d.isOpen ? 'rgba(255,112,67,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${d.isOpen ? CAT.bar.accentBorder : C.border}` }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                              <input type="checkbox" checked={d.isOpen} onChange={e => handleSchedule(day, 'isOpen', e.target.checked)} title={`${day} – ${d.isOpen ? 'abierto' : 'cerrado'}`} aria-label={`${day}, marcar como ${d.isOpen ? 'cerrado' : 'abierto'}`} style={{ width: 15, height: 15, accentColor: C.orange, cursor: 'pointer' }} />
                              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize', color: d.isOpen ? C.text : C.muted }}>{day}</span>
                            </label>
                            {d.isOpen ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <input type="time" value={d.open} onChange={e => handleSchedule(day, 'open', e.target.value)} title={`Apertura: ${day}`} aria-label={`Hora de apertura para ${day}`} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 7px', fontSize: 11, color: C.text, colorScheme: 'dark' }} />
                                <span style={{ fontSize: 10, color: C.muted }}>–</span>
                                <input type="time" value={d.close} onChange={e => handleSchedule(day, 'close', e.target.value)} title={`Cierre: ${day}`} aria-label={`Hora de cierre para ${day}`} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 7px', fontSize: 11, color: C.text, colorScheme: 'dark' }} />
                              </div>
                            ) : (
                              <span style={{ fontSize: 9.5, fontWeight: 900, color: 'rgba(239,83,80,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cerrado</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </SectionBlock>
                )}

                {/* Media */}
                <SectionBlock icon={Image} title="Imágenes / Multimedia" accent={C.cyan}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    <FieldRow>
                      <Field label="Tipo de archivo" id="mediaType">
                        <select id="mediaType" name="mediaType" value={form.mediaType} onChange={handleChange} title="Tipo de archivo multimedia" aria-label="Tipo de archivo multimedia" style={{ ...inp, colorScheme: 'dark' }}>
                          <option value="image">Imagen (JPG / PNG)</option>
                          <option value="video">Video (MP4)</option>
                        </select>
                      </Field>
                      <Field label="URL Flyer / Foto Principal" id="imageUrl" required>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input id="imageUrl" name="imageUrl" required type="url" value={form.imageUrl} onChange={handleChange} placeholder="https://..." aria-required="true" style={inp} />
                          <IconBtn icon={Eye} label="Previsualizar" color={C.cyan} bgHover="rgba(38,198,218,0.12)" onClick={() => form.imageUrl && setPreview({ url: form.imageUrl, type: form.mediaType ?? 'image' })} disabled={!form.imageUrl} size={38} />
                        </div>
                      </Field>
                    </FieldRow>
                    <Field label="URL Logo / Foto de Perfil (círculo)" id="profileImageUrl">
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input id="profileImageUrl" name="profileImageUrl" type="url" value={form.profileImageUrl ?? ''} onChange={handleChange} placeholder="https://... (imagen cuadrada)" style={inp} />
                        <IconBtn icon={Eye} label="Previsualizar logo" color={C.cyan} bgHover="rgba(38,198,218,0.12)" onClick={() => form.profileImageUrl && setPreview({ url: form.profileImageUrl, type: 'image' })} disabled={!form.profileImageUrl} size={38} />
                      </div>
                    </Field>
                  </div>
                </SectionBlock>

                {/* ── LISTA DE PROMOCIONES MÚLTIPLES ── */}
                <SectionBlock icon={Image} title="Promociones y Flyers Extras" accent={C.purple}>
                  <p style={{ fontSize: 11, color: C.muted, marginBottom: 15 }}>
                    Podés agregar múltiples imágenes o videos promocionales. Pegá la URL directa de <strong style={{ color: C.purple }}>imgur.com</strong> o similar.
                  </p>

                  {(form.promotions || []).map((promo, idx) => (
                    <div key={promo.id} style={{ background: 'rgba(255,255,255,0.02)', border: `1px dashed ${C.border}`, borderRadius: 12, padding: 15, marginBottom: 12, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 12, right: 12 }}>
                        <IconBtn icon={Trash2} label="Eliminar promo" color={C.red} bgHover="rgba(239,83,80,0.15)" onClick={() => removePromotion(promo.id)} size={28} />
                      </div>

                      <div style={{ fontWeight: 800, fontSize: 11, color: C.purple, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Promoción #{idx + 1}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                        <FieldRow>
                          <Field label="Tipo de archivo" id={`promoType_${promo.id}`}>
                            <select id={`promoType_${promo.id}`} value={promo.mediaType} onChange={e => updatePromotion(promo.id, 'mediaType', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}>
                              <option value="image">Imagen (JPG / PNG)</option>
                              <option value="video">Video (MP4)</option>
                            </select>
                          </Field>
                          <Field label="URL de la Promoción" id={`promoUrl_${promo.id}`}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input id={`promoUrl_${promo.id}`} type="url" value={promo.url} onChange={e => updatePromotion(promo.id, 'url', e.target.value)} placeholder="https://i.imgur.com/..." style={inp} />
                              <IconBtn icon={Eye} label="Previsualizar" color={C.purple} bgHover="rgba(157,111,255,0.12)" onClick={() => promo.url && setPreview({ url: promo.url, type: promo.mediaType })} disabled={!promo.url} size={38} />
                            </div>
                          </Field>
                        </FieldRow>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 13px', borderRadius: 10, background: promo.active ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${promo.active ? 'rgba(139,92,246,0.3)' : C.border}`, transition: 'all .2s' }}>
                          <input type="checkbox" checked={promo.active} onChange={e => updatePromotion(promo.id, 'active', e.target.checked)} style={{ accentColor: C.purple, width: 16, height: 16, cursor: 'pointer' }} />
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: promo.active ? C.purple : C.muted }}>Activar promoción</div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Se mostrará al usuario al ingresar al sitio y dentro del evento.</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addPromotion}
                    style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(157,111,255,0.1)', color: C.purple, border: `1px dashed rgba(157,111,255,0.3)`, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(157,111,255,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(157,111,255,0.1)'}
                  >
                    <Plus size={14} /> Agregar promoción
                  </button>
                </SectionBlock>

                {/* Redes */}
                <SectionBlock icon={Link2} title="Redes y Contacto" accent={C.purple}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 13 }}>
                    {form.category === 'evento' && (
                      <Field label="Link de Entradas (Passline, etc.)" id="ticketLink">
                        <input id="ticketLink" name="ticketLink" type="url" value={form.ticketLink ?? ''} onChange={handleChange} placeholder="https://passline.com/..." style={inp} />
                      </Field>
                    )}
                    <Field label={`Instagram${form.category === 'bar' ? ' *' : ''}`} id="instagram" required={form.category === 'bar'}>
                      <input id="instagram" name="instagram" type="url" value={form.instagram ?? ''} onChange={handleChange} required={form.category === 'bar'} placeholder="https://instagram.com/..." style={inp} />
                    </Field>
                    <Field label="Facebook" id="facebook">
                      <input id="facebook" name="facebook" type="url" value={form.facebook ?? ''} onChange={handleChange} placeholder="https://facebook.com/..." style={inp} />
                    </Field>
                    <Field label="Google Maps" id="mapsLink">
                      <input id="mapsLink" name="mapsLink" type="url" value={form.mapsLink ?? ''} onChange={handleChange} placeholder="https://maps.google.com/..." style={inp} />
                    </Field>
                  </div>
                </SectionBlock>

                {/* WhatsApp */}
                <SectionBlock icon={Phone} title="WhatsApp / Reservas" accent={C.green}>
                  <Field label="Número de WhatsApp" id="phone">
                    <input id="phone" name="phone" type="text" value={form.phone ?? ''} onChange={handleChange} disabled={sinNumero} required={!sinNumero} placeholder="5493810000000" aria-disabled={sinNumero} style={{ ...inp, opacity: sinNumero ? 0.38 : 1, cursor: sinNumero ? 'not-allowed' : 'auto', marginBottom: 10 }} />
                  </Field>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: C.muted, userSelect: 'none' }}>
                    <input type="checkbox" checked={sinNumero} onChange={e => { setSinNumero(e.target.checked); if (e.target.checked) setForm(p => ({ ...p, phone: '' })); }} title="Sin número de contacto" aria-label="Sin número de contacto" style={{ accentColor: C.green, width: 15, height: 15, cursor: 'pointer' }} />
                    Sin número de contacto
                  </label>
                </SectionBlock>

                {/* Descripción */}
                <SectionBlock icon={BookOpen} title={form.category === 'bar' ? 'Promociones y Extras' : 'Descripción del Evento'} accent={cat.accent}>
                  <label htmlFor="descArea" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
                    {form.category === 'bar' ? 'Promociones y extras' : 'Descripción del evento'}
                  </label>
                  <textarea id="descArea" name="description" required rows={4} value={form.description ?? ''} onChange={handleChange} title={form.category === 'bar' ? 'Promociones y extras' : 'Descripción del evento'} aria-required="true" placeholder={form.category === 'bar' ? 'Ej: Happy Hour hasta las 21hs, 2x1 en Pintas...' : 'Descripción breve del evento, dresscode, info adicional...'} style={{ ...inp, resize: 'vertical', minHeight: 90 }} />
                </SectionBlock>
            </>

            {/* Submit bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
              <button type="submit" disabled={isSubmitting}
                title={editingId ? 'Guardar cambios' : 'Publicar ahora'}
                aria-label={isSubmitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Publicar ahora'}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 11, background: editingId ? `linear-gradient(135deg,${C.cyan},#0288d1)` : cat.gradient, color: '#fff', fontWeight: 800, fontSize: 13.5, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, boxShadow: '0 4px 18px rgba(0,0,0,0.4)', transition: 'opacity .2s' }}>
                {isSubmitting ? <Loader2 size={16} style={{ animation: 'spin .8s linear infinite' }} /> : <Save size={16} />}
                {isSubmitting ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Publicar Ahora'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} title="Cancelar" aria-label="Cancelar edición"
                  style={{ padding: '11px 18px', borderRadius: 11, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Cancelar
                </button>
              )}
              <div role="status" aria-live="polite" style={{ marginLeft: 'auto' }}>
                {successMsg && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.green, fontSize: 13, fontWeight: 700, animation: 'fadeIn .25s ease' }}>
                    <CheckCircle2 size={15} /> {successMsg}
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* ════ TABLA DE PUBLICACIONES ════ */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden' }}>

          {/* Table toolbar */}
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
              <Hash size={15} style={{ color: C.purple }} />
              <span style={{ fontWeight: 800, fontSize: 14.5 }}>Publicaciones Activas</span>
              <span style={{ background: 'rgba(157,111,255,0.14)', color: C.purple, border: '1px solid rgba(157,111,255,0.25)', borderRadius: 99, padding: '2px 9px', fontSize: 10.5, fontWeight: 800 }}>
                {loadingData ? '…' : filtered.length}
              </span>
            </div>

            {/* Filter pills */}
            <div role="group" aria-label="Filtrar por categoría" style={{ display: 'flex', gap: 5 }}>
              {([
                ['all',    'Todas',   C.purple],
                ['evento', 'Eventos', C.pink  ],
                ['bar',    'Bares',   C.orange],
              ] as const).map(([v, l, c]) => (
                <button key={v} onClick={() => setFilterCat(v as any)}
                  title={`Filtrar: ${l}`} aria-label={`Filtrar por ${l}`} aria-pressed={filterCat === v}
                  style={{ padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer', background: filterCat === v ? `${c}1e` : 'rgba(255,255,255,0.04)', color: filterCat === v ? c : C.muted, outline: filterCat === v ? `1.5px solid ${c}44` : 'none', transition: 'all .15s' }}>
                  {l}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
              <label htmlFor="tSearch" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>Buscar</label>
              <input id="tSearch" type="search" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar publicaciones" style={{ ...inp, paddingLeft: 30, width: 175, fontSize: 12 }} />
            </div>
          </div>

          {/* Loading / error / table */}
          {loadingData ? (
            <div style={{ padding: '50px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: C.muted }}>
              <Loader2 size={26} style={{ animation: 'spin .8s linear infinite', color: C.purple }} />
              <span style={{ fontSize: 13 }}>Cargando publicaciones desde Firestore…</span>
            </div>
          ) : dataError ? (
            <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: C.red, fontSize: 13 }}>
              <AlertCircle size={26} />
              {dataError}
              <button type="button" onClick={fetchEvents} style={{ marginTop: 4, padding: '7px 16px', borderRadius: 8, background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.25)', color: C.red, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={13} /> Reintentar
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }} aria-label="Lista de publicaciones activas">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.018)' }}>
                    {['Tipo','Título / Nombre','Detalle','Fecha','Acciones'].map(h => (
                      <th key={h} scope="col" style={{ padding: '10px 15px', textAlign: 'left', fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '44px 0', textAlign: 'center', color: C.muted }}>
                        <LayoutGrid size={26} style={{ margin: '0 auto 10px', opacity: 0.35, display: 'block' }} />
                        <span style={{ fontSize: 13 }}>Sin resultados</span>
                      </td>
                    </tr>
                  ) : filtered.map((ev, i) => (
                    <tr key={ev.id}
                      style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)', transition: 'background .14s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)')}
                    >
                      <td style={{ padding: '12px 15px' }}><Chip category={ev.category} /></td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {ev.imageUrl && <img src={ev.imageUrl} alt="" aria-hidden="true" style={{ width: 34, height: 34, borderRadius: 7, objectFit: 'cover', flexShrink: 0, background: C.surface }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                          <div>
                            <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{ev.title}</div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                              {ev.venue || ev.locality}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', fontSize: 12, color: CAT[ev.category as keyof typeof CAT]?.accent ?? C.muted }}>
                        {ev.category === 'bar' ? 'Semanal' : ev.locality}
                      </td>
                      <td style={{ padding: '12px 15px', whiteSpace: 'nowrap', color: C.muted, fontSize: 12 }}>
                        {fmtDate(ev.date ?? '')}
                      </td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                          <IconBtn icon={Eye}    label={`Ver imagen: ${ev.title}`}        color={C.purple} bgHover="rgba(157,111,255,0.12)" onClick={() => ev.imageUrl && setPreview({ url: ev.imageUrl, type: ev.mediaType ?? 'image' })} disabled={!ev.imageUrl} />
                          <IconBtn icon={Edit2}  label={`Actualizar flyer o video: ${ev.title}`} color={C.cyan} bgHover="rgba(38,198,218,0.1)" onClick={() => loadIntoForm(ev)} />
                          <IconBtn icon={Trash2} label={`Eliminar: ${ev.title}`}          color={C.red}    bgHover="rgba(239,83,80,0.1)"    onClick={() => handleDelete(ev.id, ev.title)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}