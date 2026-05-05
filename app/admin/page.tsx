'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { CalendarPlus, Save, CheckCircle, Loader2, Edit, Trash2, LogOut, Calendar, FilterX, Copy, Search } from 'lucide-react';

const localidadesTucuman = [
  "Aguilares", "Alderetes", "Acheral", "Amaicha del Valle", "Banda del Río Salí",
  "Bella Vista", "Burruyacú", "Colalao del Valle", "Cruz Alta", "Concepción",
  "Delfín Gallo", "El Cadillal", "El Manantial", "Estación Aráoz", "Famaillá",
  "Graneros", "Juan Bautista Alberdi", "La Cocha", "La Florida", "Las Talitas",
  "Leales", "Lastenia", "Los Ralos", "Lules", "Monteros", "Raco", "Ranchillos",
  "Río Seco", "San Andrés", "San Javier", "San Miguel de Tucumán", "San Pablo",
  "San Pedro de Colalao", "Santa Ana", "Simoca", "Tafí del Valle", "Tafí Viejo",
  "Trancas", "Villa Carmela", "Villa Quinteros", "Yerba Buena", "Interior / Otra"
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
  mediaType: string; 
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [events, setEvents] = useState<EventData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [sinNumero, setSinNumero] = useState(false);
  
  const [filterDate, setFilterDate] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState(''); 

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

  // 👇 ACÁ ESTÁ LA MAGIA PARA LIMPIAR EL LINK 👇
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let cleanValue = value;

    // Si el usuario está pegando algo en el campo imageUrl, le borramos los corchetes
    if (name === 'imageUrl') {
      // Reemplaza [img], [/img], [IMG], [/IMG] por nada (texto vacío) y borra espacios al inicio/final
      cleanValue = value.replace(/\[\/?img\]/gi, '').trim();
    }

    setFormData(prev => ({ ...prev, [name]: cleanValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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
    setSinNumero(!evento.phone || evento.phone.trim() === '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicate = (evento: EventData) => {
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
    setEditingId(null); 
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

  const availableDates = useMemo(() => {
    const dates = events.map(e => {
      if (!e.date) return null;
      return e.date.split('T')[0]; 
    }).filter(Boolean) as string[];
    
    const uniqueDates = Array.from(new Set(dates)).sort(); 
    return ['Todas', ...uniqueDates];
  }, [events]);

  const filteredTableEvents = useMemo(() => {
    return events.filter(event => {
      const matchDate = filterDate === 'Todas' || (event.date && event.date.startsWith(filterDate));
      
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        (event.title && event.title.toLowerCase().includes(term)) ||
        (event.venue && event.venue.toLowerCase().includes(term)) ||
        (event.locality && event.locality.toLowerCase().includes(term));
        
      return matchDate && matchSearch;
    });
  }, [events, filterDate, searchTerm]);

  const formatShortDate = (dateStr: string) => {
    if (dateStr === 'Todas') return 'Todas las fechas';
    try {
      const [year, month, day] = dateStr.split('-');
      const fecha = new Date(Number(year), Number(month) - 1, Number(day));
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return `${dias[fecha.getDay()]} ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
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

        {/* FORMULARIO DE CARGA */}
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
                {/* Al pegar acá, la función handleChange limpia automáticamente los corchetes */}
                <input id="imageUrl" required type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://i.imgur.com/..." className={inputStyles} />
              </div>
            </div>

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

        {/* TABLA DE EVENTOS CON BUSCADORES */}
        <div className="bg-night-800 rounded-2xl border border-night-700 shadow-xl overflow-hidden">
          
          <div className="p-6 border-b border-night-700 bg-night-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 whitespace-nowrap">
              Eventos Publicados
              <span className="bg-night-700 text-xs px-2 py-1 rounded-full text-brand-primary font-mono">
                {filteredTableEvents.length}
              </span>
            </h2>

            {/* CONTENEDOR DE FILTROS: Texto + Fecha */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Buscar joda, lugar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-night-900 border border-night-600 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                  <select 
                    aria-label="Buscar eventos por fecha" 
                    value={filterDate} 
                    onChange={(e) => setFilterDate(e.target.value)} 
                    className="w-full appearance-none bg-night-900 border border-night-600 rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-primary cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    {availableDates.map(date => (
                      <option key={date} value={date} className="bg-night-900 text-white">
                        {formatShortDate(date)}
                      </option>
                    ))}
                  </select>
                </div>
                
                {(filterDate !== 'Todas' || searchTerm !== '') && (
                  <button 
                    onClick={() => { setFilterDate('Todas'); setSearchTerm(''); }} 
                    title="Limpiar filtros"
                    className="p-2 bg-night-900 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-night-600 rounded-lg transition-colors shrink-0"
                  >
                    <FilterX size={18} />
                  </button>
                )}
              </div>

            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-night-900 text-gray-300 uppercase font-semibold text-xs border-b border-night-700">
                <tr>
                  <th className="px-6 py-4">Evento</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Formato</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-night-700">
                {filteredTableEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-night-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{evt.title}</div>
                      <div className="text-xs text-brand-primary mt-0.5">{evt.venue || evt.locality}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{evt.date ? formatShortDate(evt.date.split('T')[0]) : '-'}</td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`border px-2 py-1 rounded text-xs ${evt.mediaType === 'video' ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-night-900 text-gray-300 border-night-700'}`}>
                        {evt.mediaType === 'video' ? 'Video' : 'Imagen'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-1 sm:gap-3">
                      <button onClick={() => handleDuplicate(evt)} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors" title="Copiar datos para evento nuevo">
                        <Copy size={18} />
                      </button>
                      <button onClick={() => handleEdit(evt)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Editar">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(evt.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTableEvents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No encontramos eventos con esos filtros.
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