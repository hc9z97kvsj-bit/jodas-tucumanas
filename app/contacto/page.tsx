'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle, Loader2, PartyPopper, MessageSquare, Phone, User, Calendar, Zap, MapPin, ExternalLink } from 'lucide-react';

/* ── Custom Icons ── */
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.529 5.845L.057 23.885l6.209-1.628A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.807 9.807 0 0 1-5.001-1.372l-.359-.213-3.686.967.984-3.594-.234-.369A9.818 9.818 0 0 1 2.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z" />
    </svg>
  );
}
function IgIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function Field({ icon: Icon, iconColor = 'rgba(139,92,246,0.7)', children, alignTop = false }: { icon: React.ElementType; iconColor?: string; children: React.ReactNode; alignTop?: boolean }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 14, top: alignTop ? 16 : '50%', transform: alignTop ? 'none' : 'translateY(-50%)', color: iconColor, pointerEvents: 'none', zIndex: 1 }}>
        <Icon size={17} />
      </div>
      {children}
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
  paddingLeft: 44, paddingRight: 16, paddingTop: 14, paddingBottom: 14, color: '#fff', fontSize: 14, fontWeight: 500,
  outline: 'none', transition: 'border-color 0.2s, background 0.2s', boxSizing: 'border-box'
};

export default function ContactoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess]           = useState(false);
  const [formData, setFormData]         = useState({ organizador: '', telefono: '', evento: '', fecha: '', mensaje: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'solicitudes'), { ...formData, fechaSolicitud: new Date().toISOString(), leido: false });
      setSuccess(true);
      setFormData({ organizador: '', telefono: '', evento: '', fecha: '', mensaje: '' });
      setTimeout(() => setSuccess(false), 6000);
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      alert('Hubo un error al enviar el mensaje. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'inherit' }} className="overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-[-15%] right-[-5%] w-[50vw] h-[50vw] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle,#8B5CF6,transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle,#EC4899,transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 40, fontSize: 13, fontWeight: 700, padding: '8px 16px 8px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', transition: 'color 0.2s' }}>
          <ArrowLeft size={15} /> Volver a la cartelera
        </Link>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px', background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(139,92,246,0.4)' }}>
              <PartyPopper size={26} color="#fff" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Sumá tu <span style={{ color: '#8B5CF6', textShadow: '0 0 30px rgba(139,92,246,0.5)' }}>Joda</span> a la Cartelera</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.65, fontWeight: 500 }}>¿Estás organizando una fiesta, un recital o un evento en Tucumán?<br />Completá el formulario o contactanos directo por WhatsApp.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="lg:grid-cols-[320px_1fr]">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ borderRadius: 20, padding: '24px', background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(236,72,153,0.06))', border: '1px solid rgba(139,92,246,0.2)' }}>
                <p className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: 'rgba(139,92,246,0.8)' }}>¿Qué incluye?</p>
                {[ { icon: Zap, text: 'Publicación gratuita en la cartelera' }, { icon: MapPin, text: 'Visible en toda la provincia' }, { icon: IgIcon, text: 'Enlace a tu redes y contacto directo' } ].map(({ icon: Icon, text }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                      <Icon size={14} />
                    </div>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{text}</span>
                  </div>
                ))}
              </div>

              <a href="https://wa.me/543816537730?text=Hola%21+Quiero+publicar+mi+evento+en+Jodas+Tucumanas" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 20, textDecoration: 'none', background: 'linear-gradient(135deg,rgba(37,211,102,0.12),rgba(37,211,102,0.06))', border: '1px solid rgba(37,211,102,0.3)', transition: 'border-color 0.2s, background 0.2s' }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: 'linear-gradient(135deg,#25D366,#128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(37,211,102,0.35)' }}>
                  <WhatsAppIcon size={22} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#25D366', marginBottom: 3 }}>WhatsApp directo</p>
                  <p style={{ fontSize: 16, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>381 653-7730</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: 500 }}>Respondemos a la brevedad</p>
                </div>
                <ExternalLink size={14} style={{ color: 'rgba(37,211,102,0.5)', marginLeft: 'auto', flexShrink: 0 }} />
              </a>
            </div>

            <div style={{ borderRadius: 24, overflow: 'hidden', background: 'rgba(14,14,14,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg,#8B5CF6,#EC4899,#06B6D4)' }} />
              <div style={{ padding: '28px 28px 32px' }}>
                {success ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 0', gap: 16 }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', marginBottom: 8, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(74,222,128,0.2)' }}>
                      <CheckCircle size={34} color="#4ade80" />
                    </div>
                    <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0 }}>¡Solicitud enviada!</h2>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', maxWidth: 320, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                      Recibimos los datos de tu evento. Nos vamos a poner en contacto por WhatsApp a la brevedad.
                    </p>
                    <a href="https://wa.me/543816537730?text=Hola%21+Ya+envié+la+solicitud+por+el+sitio" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 14, textDecoration: 'none', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 8 }}>
                      <WhatsAppIcon size={15} /> Ir al WhatsApp
                    </a>
                    <button onClick={() => setSuccess(false)} style={{ padding: '10px 20px', borderRadius: 12, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', background: 'none', border: '1px solid rgba(255,255,255,0.08)' }}>
                      Enviar otro evento
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>Datos del evento</p>
                    
                    <Field icon={User} iconColor="rgba(139,92,246,0.7)">
                      <input required type="text" name="organizador" value={formData.organizador} onChange={handleChange} placeholder="Tu nombre o productora" title="Tu nombre" aria-label="Tu nombre" style={INPUT_STYLE} className="focus-purple" />
                    </Field>

                    <Field icon={Phone} iconColor="rgba(37,211,102,0.7)">
                      <input required type="text" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Tu WhatsApp (ej: 381 123-4567)" title="Tu WhatsApp" aria-label="Tu WhatsApp" style={INPUT_STYLE} className="focus-purple" />
                    </Field>

                    <Field icon={PartyPopper} iconColor="rgba(236,72,153,0.7)">
                      <input required type="text" name="evento" value={formData.evento} onChange={handleChange} placeholder="Nombre de la fiesta / evento" title="Nombre del evento" aria-label="Nombre del evento" style={INPUT_STYLE} className="focus-purple" />
                    </Field>

                    <Field icon={Calendar} iconColor="rgba(6,182,212,0.7)">
                      <input required type="date" name="fecha" value={formData.fecha} onChange={handleChange} title="Fecha del evento" aria-label="Fecha del evento" style={{ ...INPUT_STYLE, colorScheme: 'dark' }} className="focus-purple [color-scheme:dark]" />
                    </Field>

                    <Field icon={MessageSquare} iconColor="rgba(139,92,246,0.5)" alignTop>
                      <textarea required name="mensaje" value={formData.mensaje} onChange={handleChange} rows={4} placeholder="Contanos sobre el evento, o pegá el link de tu Instagram o flyer..." title="Mensaje o link" aria-label="Mensaje o link" style={{ ...INPUT_STYLE, paddingTop: 14, resize: 'none' }} className="focus-purple" />
                    </Field>

                    <button type="submit" disabled={isSubmitting} style={{ width: '100%', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px 24px', borderRadius: 16, background: isSubmitting ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg,#8B5CF6,#EC4899)', color: '#fff', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: isSubmitting ? 'none' : '0 8px 28px rgba(139,92,246,0.35)', transition: 'all 0.2s' }}>
                      {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Enviando...</> : <><Send size={16} /> Solicitar publicación</>}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .focus-purple:focus { border-color: rgba(139,92,246,0.6) !important; background: rgba(139,92,246,0.05) !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }
        .focus-purple::placeholder { color: rgba(255,255,255,0.2); }
        .lg\\:grid-cols-\\[320px_1fr\\] { grid-template-columns: 320px 1fr; }
        @media (max-width: 1023px) { .lg\\:grid-cols-\\[320px_1fr\\] { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}