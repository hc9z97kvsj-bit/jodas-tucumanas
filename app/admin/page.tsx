'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { CalendarPlus, Save, CheckCircle, Loader2, Edit, Trash2, LogOut } from 'lucide-react';

// Listado hiper completo de localidades y comunas de Tucumán (Ordenado alfabéticamente)
const localidadesTucuman = [
  "Aguilares",
  "Alderetes",
  "Amaicha del Valle",
  "Banda del Río Salí",
  "Bella Vista",
  "Burruyacú",
  "Colalao del Valle",
  "Concepción",
  "Delfín Gallo",
  "El Cadillal",
  "El Manantial",
  "Estación Aráoz",
  "Famaillá",
  "Graneros",
  "Juan Bautista Alberdi",
  "La Cocha",
  "La Florida",
  "Las Talitas",
  "Leales",
  "Los Ralos",
  "Lules",
  "Monteros",
  "Raco",
  "Ranchillos",
  "Río Seco",
  "San Andrés",
  "San Javier",
  "San Miguel de Tucumán",
  "San Pablo",
  "San Pedro de Colalao",
  "Santa Ana",
  "Simoca",
  "Tafí del Valle",
  "Tafí Viejo",
  "Trancas",
  "Villa Carmela",
  "Villa Quinteros",
  "Yerba Buena",
  "Interior / Otra"
];

interface EventData {
  id: string;
  title: string;
  venue: string;
  imageUrl: string;
  location: string;
  locality: string;
  date: string;
  musicType: string;
  phone: string;
  description: string;
  rating: number;
  mediaType: string; // <-- NUEVO: Para saber si es imagen o video
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [events, setEvents] = useState<EventData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // NUEVO: Estado para la casilla de "Sin número"
  const [sinNumero, setSinNumero] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    imageUrl: '',
    location: '',
    locality: 'San Miguel de Tucumán',
    date: '',
    musicType: 'Cuarteto',
    phone: '',
    description: '',
    rating: 5,
    mediaType: 'image'
  });

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
  }, [router]);

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, 'eventos'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const eventosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventData[];
      setEvents(eventosData);
    } catch (error) {
      console.error("Error al obtener eventos:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Lógica "Sin número": Si está tildado, forzamos el teléfono vacío
      const eventPayload = {
        ...formData,
        phone: sinNumero ? '' : formData.phone
      };

      if (editingId) {
        const eventRef = doc(db, 'eventos', editingId);
        await updateDoc(eventRef, eventPayload);
        setSuccessMessage('Evento actualizado correctamente');
      } else {
        await addDoc(collection(db, 'eventos'), {
          ...eventPayload,
          createdAt: new Date().toISOString()
        });
        setSuccessMessage('Evento publicado en la cartelera');
      }

      // Reseteamos el formulario y la casilla
      setFormData({
        title: '', venue: '', imageUrl: '', location: '', locality: 'San Miguel de Tucumán', date: '', musicType: 'Cuarteto', phone: '', description: '', rating: 5, mediaType: 'image'
      });
      setSinNumero(false);
      setEditingId(null);
      fetchEvents();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error al procesar el evento:", error);
      alert("Hubo un error en la base de datos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (evento: EventData) => {
    setFormData({
      title: evento.title || '',
      venue: evento.venue || '',
      imageUrl: evento.imageUrl || '',
      location: evento.location || '',
      locality: evento.locality || 'San Miguel de Tucumán',
      date: evento.date || '',
      musicType: evento.musicType || 'Cuarteto',
      phone: evento.phone || '',
      description: evento.description || '',
      rating: evento.rating || 5,
      mediaType: evento.mediaType || 'image'
    });
    setEditingId(evento.id);
    
    // Si el evento viejo no tiene teléfono, marcamos la casilla de "Sin número" automáticamente
    setSinNumero(!evento.phone || evento.phone.trim() === '');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este evento permanentemente?')) {
      try {
        await deleteDoc(doc(db, 'eventos', id));
        fetchEvents();
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const resetForm = () => {
    setEditingId(null);
    setSinNumero(false);
    setFormData({ title: '', venue: '', imageUrl: '', location: '', locality: 'San Miguel de Tucumán', date: '', musicType: 'Cuarteto', phone: '', description: '', rating: 5, mediaType: 'image' });
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-night-900 flex justify-center items-center">
        <Loader2 className="animate-spin text-brand-primary w-10 h-10" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const inputStyles = "w-full bg-night-900 border border-night-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors";
  const labelStyles = "block text-sm font-medium text-gray-400 mb-1.5";

  return (
    <div className="min-h-screen bg-night-900 text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-night-700 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-brand-primary/20 p-2 rounded-lg">
              <CalendarPlus className="text-brand-primary" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gestión de Cartelera</h1>
              <p className="text-gray-400 text-sm">Administración segura</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors bg-night-800 px-4 py-2 rounded-lg border border-night-700"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>

        <div className="bg-night-800 rounded-2xl p-6 sm:p-8 border border-night-700 shadow-xl mb-10">
          <h2 className="text-xl font-bold mb-6 text-brand-primary">
            {editingId ? 'Editando Evento Existente' : 'Cargar Nuevo Evento'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className={labelStyles}>Nombre del Evento / Fiesta</label>
                <input id="title" required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Ej: El Cumbión, La Konga..." className={inputStyles} />
              </div>
              <div>
                <label htmlFor="venue" className={labelStyles}>Lugar / Boliche</label>
                <input id="venue" required type="text" name="venue" value={formData.venue} onChange={handleChange} placeholder="Ej: Jungle, Club Central Córdoba..." className={inputStyles} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="locality" className={labelStyles}>Localidad / Zona</label>
                <select 
                  id="locality" 
                  name="locality" 
                  value={formData.locality} 
                  onChange={handleChange} 
                  className={inputStyles}
                  style={{ colorScheme: 'dark' }} 
                >
                  {localidadesTucuman.map((loc) => (
                    <option key={loc} value={loc} style={{ backgroundColor: '#111827', color: 'white' }}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="location" className={labelStyles}>Dirección Exacta</label>
                <input id="location" required type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Ej: 24 de Septiembre 1326" className={inputStyles} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className={labelStyles}>Fecha y Hora</label>
                <input id="date" required type="datetime-local" name="date" value={formData.date} onChange={handleChange} className={inputStyles} />
              </div>
              <div>
                <label htmlFor="musicType" className={labelStyles}>Tipo de Música</label>
                <select 
                  id="musicType" 
                  name="musicType" 
                  value={formData.musicType} 
                  onChange={handleChange} 
                  className={inputStyles}
                  style={{ colorScheme: 'dark' }} 
                >
                  <option value="Cuarteto" style={{ backgroundColor: '#111827', color: 'white' }}>Cuarteto</option>
                  <option value="Cumbia" style={{ backgroundColor: '#111827', color: 'white' }}>Cumbia</option>
                  <option value="Electrónica" style={{ backgroundColor: '#111827', color: 'white' }}>Electrónica</option>
                  <option value="Reggaeton" style={{ backgroundColor: '#111827', color: 'white' }}>Reggaeton</option>
                  <option value="Folklore" style={{ backgroundColor: '#111827', color: 'white' }}>Folklore</option>
                  <option value="Varios" style={{ backgroundColor: '#111827', color: 'white' }}>Varios</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="mediaType" className={labelStyles}>Formato del Flyer</label>
                <select 
                  id="mediaType" 
                  name="mediaType" 
                  value={formData.mediaType} 
                  onChange={handleChange} 
                  className={inputStyles}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="image" style={{ backgroundColor: '#111827', color: 'white' }}>Imagen estática (JPG/PNG)</option>
                  <option value="video" style={{ backgroundColor: '#111827', color: 'white' }}>Video Animado (MP4)</option>
                </select>
              </div>
              <div>
                <label htmlFor="imageUrl" className={labelStyles}>Enlace del Archivo (URL)</label>
                <input id="imageUrl" required type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://..." className={inputStyles} />
              </div>
            </div>

            {/* SECCIÓN ACTUALIZADA: WhatsApp Inteligente */}
            <div className="bg-night-900/50 p-4 rounded-xl border border-night-700">
              <label htmlFor="phone" className={labelStyles}>WhatsApp (Para reservas)</label>
              <div className="flex flex-col gap-3 mt-2">
                <input 
                  id="phone" 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="Ej: 5493810000000 sin el +" 
                  required={!sinNumero}
                  disabled={sinNumero}
                  className={`${inputStyles} ${sinNumero ? 'opacity-40 cursor-not-allowed bg-night-800' : ''}`}
                />
                
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sinNumero}
                    onChange={(e) => {
                      setSinNumero(e.target.checked);
                      if (e.target.checked) {
                        setFormData((prev) => ({ ...prev, phone: "" }));
                      }
                    }}
                    className="w-5 h-5 rounded border-night-700 text-brand-primary focus:ring-brand-primary bg-night-900"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    (x) El organizador no dejó número de contacto
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="description" className={labelStyles}>Descripción Corta</label>
              <textarea id="description" required name="description" value={formData.description} onChange={handleChange} rows={3} className={`${inputStyles} resize-none`}></textarea>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-night-700">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`flex items-center gap-2 text-white px-6 py-3 rounded-xl font-medium transition-colors ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-brand-primary hover:bg-brand-primary/90'} disabled:opacity-50`}
              >
                <Save size={20} />
                {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar Evento' : 'Publicar Evento'}
              </button>
              
              {editingId && (
                <button type="button" onClick={resetForm} className="text-gray-400 hover:text-white px-4 py-2 border border-transparent hover:border-night-700 rounded-lg transition-all">
                  Cancelar
                </button>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 text-green-400 text-sm animate-pulse md:ml-auto w-full md:w-auto mt-2 md:mt-0">
                  <CheckCircle size={18} />
                  <span>{successMessage}</span>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="bg-night-800 rounded-2xl border border-night-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-night-700 bg-night-900/50">
            <h2 className="text-xl font-bold">Eventos Publicados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-night-900 text-gray-300 uppercase font-semibold text-xs border-b border-night-700">
                <tr>
                  <th className="px-6 py-4">Evento</th>
                  <th className="px-6 py-4">Zona</th>
                  <th className="px-6 py-4">Formato</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-night-700">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-night-900/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{evt.title}</td>
                    <td className="px-6 py-4">{evt.locality || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="bg-night-900 text-gray-300 border border-night-700 px-2 py-1 rounded text-xs">
                        {evt.mediaType === 'video' ? 'Video' : 'Imagen'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-3">
                      <button onClick={() => handleEdit(evt)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Editar">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(evt.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No hay eventos publicados aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}