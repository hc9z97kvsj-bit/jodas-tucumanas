'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle, Loader2, PartyPopper, MessageSquare, Phone, User, Calendar } from 'lucide-react';

export default function ContactoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    organizador: '',
    telefono: '',
    evento: '',
    fecha: '',
    mensaje: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Guardamos la solicitud en una nueva colección de Firebase llamada "solicitudes"
      await addDoc(collection(db, 'solicitudes'), {
        ...formData,
        fechaSolicitud: new Date().toISOString(),
        leido: false // Para que después sepas cuáles ya revisaste
      });
      
      setSuccess(true);
      setFormData({ organizador: '', telefono: '', evento: '', fecha: '', mensaje: '' });
      
      // Ocultamos el mensaje de éxito después de unos segundos
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error("Error al enviar solicitud:", error);
      alert("Hubo un error al enviar el mensaje. Intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyles = "w-full bg-night-900/80 border border-night-700 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-[#D751F5] focus:ring-1 focus:ring-[#D751F5] transition-colors placeholder:text-gray-500 shadow-inner";

  return (
    <main className="min-h-screen text-white py-10 px-4 sm:px-8 relative z-10 flex flex-col items-center justify-center">
      
      <div className="w-full max-w-4xl">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 bg-night-800/50 p-2 pr-4 rounded-full border border-night-700 backdrop-blur-md"
        >
          <div className="bg-night-800 p-1.5 rounded-full">
            <ArrowLeft size={18} />
          </div>
          <span className="text-sm font-medium">Volver a la cartelera</span>
        </Link>
      </div>

      <div className="w-full max-w-4xl bg-night-800/80 backdrop-blur-xl border border-night-700 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* PANEL IZQUIERDO: INFO */}
        <div className="bg-gradient-to-br from-night-900 to-[#351159] p-8 md:p-12 md:w-2/5 flex flex-col justify-center relative overflow-hidden">
          {/* Luces decorativas de fondo */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#D751F5]/20 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#FF0A23]/20 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="relative z-10">
            <div className="bg-[#D751F5]/20 w-16 h-16 rounded-2xl flex items-center justify-center text-[#D751F5] mb-6 border border-[#D751F5]/30 shadow-[0_0_15px_rgba(215,81,245,0.2)]">
              <PartyPopper size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
              Sumá tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D751F5] to-[#FF0A23]">Joda</span> a la Cartelera
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              ¿Estás organizando una fiesta, un recital o un evento en Tucumán? Dejanos tus datos y la subimos para que la vea toda la provincia.
            </p>
            <ul className="space-y-4 text-sm font-medium text-gray-400">
              <li className="flex items-center gap-3">
                <CheckCircle size={18} className="text-green-400" /> Publicación 100% gratuita.
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle size={18} className="text-green-400" /> Enlace directo a tu WhatsApp.
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle size={18} className="text-green-400" /> Posicionamiento en toda la provincia.
              </li>
            </ul>
          </div>
        </div>

        {/* PANEL DERECHO: FORMULARIO */}
        <div className="p-8 md:p-12 md:w-3/5 bg-night-800/50">
          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-500 py-10">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mb-4 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-3xl font-bold text-white">¡Solicitud Enviada!</h2>
              <p className="text-gray-400 max-w-sm">
                Ya recibimos los datos de tu evento. Lo vamos a revisar y nos pondremos en contacto con vos por WhatsApp a la brevedad.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="mt-6 px-6 py-2.5 bg-night-900 border border-night-700 rounded-xl text-brand-primary font-medium hover:bg-night-700 transition-colors"
              >
                Enviar otro evento
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  required 
                  type="text" 
                  name="organizador" 
                  value={formData.organizador} 
                  onChange={handleChange} 
                  placeholder="Tu Nombre o Productora" 
                  className={inputStyles} 
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  required 
                  type="text" 
                  name="telefono" 
                  value={formData.telefono} 
                  onChange={handleChange} 
                  placeholder="Tu WhatsApp (Ej: 381...)" 
                  className={inputStyles} 
                />
              </div>

              <div className="relative">
                <PartyPopper className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  required 
                  type="text" 
                  name="evento" 
                  value={formData.evento} 
                  onChange={handleChange} 
                  placeholder="Nombre de la Fiesta / Evento" 
                  className={inputStyles} 
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  required 
                  type="date" 
                  name="fecha" 
                  value={formData.fecha} 
                  onChange={handleChange} 
                  className={`${inputStyles} [color-scheme:dark]`} 
                />
              </div>

              <div className="relative">
                <MessageSquare className="absolute left-4 top-6 -translate-y-1/2 text-gray-500" size={20} />
                <textarea 
                  required 
                  name="mensaje" 
                  value={formData.mensaje} 
                  onChange={handleChange} 
                  rows={4} 
                  placeholder="Contanos sobre el evento o pegá acá el link de tu Instagram/Flyer..." 
                  className={`${inputStyles} pl-12 py-3 resize-none`} 
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-[#D751F5] to-[#FF0A23] text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_25px_rgba(215,81,245,0.4)] hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Enviando solicitud...
                  </>
                ) : (
                  <>
                    <Send size={24} />
                    Solicitar Publicación
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}