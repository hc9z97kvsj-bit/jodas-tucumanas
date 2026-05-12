'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { 
  Inbox, User, Phone, Calendar, MessageSquare, Trash2, 
  Clock, ArrowLeft, Loader2, MailOpen, Mail, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface Solicitud {
  id: string;
  organizador: string;
  telefono: string;
  evento: string;
  fecha: string;
  mensaje: string;
  fechaSolicitud: string;
  leido: boolean;
}

export default function SolicitudesAdmin() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) { fetchSolicitudes(); } 
      else { router.push('/login'); }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchSolicitudes = async () => {
    try {
      const q = query(collection(db, 'solicitudes'), orderBy('fechaSolicitud', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Solicitud[];
      setSolicitudes(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    } catch (error) {
      console.error("Error al buscar solicitudes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar el estado de lectura (Toggle)
  const toggleReadStatus = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await updateDoc(doc(db, 'solicitudes', id), { leido: newStatus });
      setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, leido: newStatus } : s));
    } catch (e) {
      console.error("Error al actualizar estado:", e);
    }
  };

  const deleteSolicitud = async (id: string) => {
    if (!window.confirm('¿Borrar esta solicitud definitivamente?')) return;
    try {
      await deleteDoc(doc(db, 'solicitudes', id));
      setSolicitudes(prev => prev.filter(s => s.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (e) { console.error(e); }
  };

  const selectedSoli = solicitudes.find(s => s.id === selectedId);
  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center text-indigo-600">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="text-slate-500 font-medium">Sincronizando mensajes...</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-slate-800 overflow-hidden">
      
      {/* SIDEBAR: LISTA DE MENSAJES */}
      <aside className="w-full md:w-[350px] bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <Inbox size={20} />
              </div>
              <h1 className="text-lg font-bold">Solicitudes</h1>
            </div>
            <Link href="/admin" title="Volver" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
              <ArrowLeft size={20} />
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
          {solicitudes.map((soli) => (
            <div 
              key={soli.id}
              onClick={() => { setSelectedId(soli.id); if (!soli.leido) toggleReadStatus(soli.id, false); }}
              className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                selectedId === soli.id 
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                  : 'bg-transparent border-transparent hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  soli.leido ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {getInitials(soli.organizador)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className={`text-sm truncate ${soli.leido ? 'font-medium text-slate-500' : 'font-bold text-slate-900'}`}>
                      {soli.organizador}
                    </h4>
                    {!soli.leido && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{soli.evento}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN: DETALLE DEL MENSAJE */}
      <main className="hidden md:flex flex-1 bg-[#F4F5F7] flex-col overflow-y-auto">
        {selectedSoli ? (
          <div className="p-8 lg:p-12 max-w-4xl mx-auto w-full">
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl">
                    {getInitials(selectedSoli.organizador)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedSoli.organizador}</h2>
                    <p className="text-sm text-slate-500">Recibido el {new Date(selectedSoli.fechaSolicitud).toLocaleString('es-AR')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Botón para cambiar estado leído/no leído */}
                  <button 
                    onClick={() => toggleReadStatus(selectedSoli.id, selectedSoli.leido)}
                    title={selectedSoli.leido ? "Marcar como no leído" : "Marcar como leído"}
                    className={`p-2.5 rounded-xl border transition-all ${
                      selectedSoli.leido 
                        ? 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200' 
                        : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {selectedSoli.leido ? <Mail size={20} /> : <CheckCircle2 size={20} />}
                  </button>
                  <button 
                    onClick={() => deleteSolicitud(selectedSoli.id)}
                    className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8">
                <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
                  Propuesta de Evento
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-8">{selectedSoli.evento}</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">WhatsApp</p>
                    <p className="font-bold text-slate-700">{selectedSoli.telefono}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha Evento</p>
                    <p className="font-bold text-slate-700">{new Date(selectedSoli.fecha).toLocaleDateString('es-AR', { dateStyle: 'long' })}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Mensaje del organizador</p>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 leading-relaxed italic">
                    "{selectedSoli.mensaje}"
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex gap-4">
                  <a 
                    href={`https://wa.me/${selectedSoli.telefono.replace(/\D/g,'')}`}
                    target="_blank"
                    className="flex-1 bg-white border border-slate-200 text-slate-700 h-14 flex items-center justify-center gap-3 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                  >
                    <Phone size={20} className="text-green-500" /> Hablar por WhatsApp
                  </a>
                  <Link 
                    href="/admin"
                    className="flex-1 bg-indigo-600 text-white h-14 flex items-center justify-center gap-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                  >
                    Cargar a la Cartelera
                  </Link>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <MailOpen size={80} strokeWidth={1} className="mb-4" />
            <p className="text-lg font-medium text-slate-400">Seleccioná un pedido para gestionarlo</p>
          </div>
        )}
      </main>
    </div>
  );
}