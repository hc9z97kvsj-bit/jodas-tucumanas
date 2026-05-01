'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EventCard from '@/components/EventCard';
import { Loader2, MapPin, Music, FilterX, Calendar, Trophy, Flame } from 'lucide-react';

interface EventData {
  id: string;
  title: string;
  venue?: string;
  imageUrl: string;
  location: string;
  locality?: string;
  date: string;
  musicType: string;
  rating?: number;
  likes?: number; 
  mediaType?: string; 
}

export default function Home() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedZone, setSelectedZone] = useState('Todas');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [selectedDate, setSelectedDate] = useState('Todas');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'eventos'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const todosLosEventos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EventData[];

        const limiteExpiracion = new Date();
        limiteExpiracion.setHours(limiteExpiracion.getHours() - 12);

        const eventosActivos = todosLosEventos.filter(evento => {
          if (!evento.date) return false;
          const fechaEvento = new Date(evento.date);
          return fechaEvento >= limiteExpiracion;
        });

        setEvents(eventosActivos);
        
      } catch (error) {
        console.error("Error al obtener los eventos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // --- LÓGICA DEL RANKING "ALTA JODA" ---
  const topEventos = useMemo(() => {
    // 1. Filtramos solo eventos que tengan al menos 1 "Me gusta"
    const eventosConLikes = events.filter(e => (e.likes || 0) > 0);
    
    // 2. Ordenamos de mayor a menor cantidad de likes
    const ordenados = eventosConLikes.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    
    // 3. Devolvemos solo el Top 3 (o el Top 4 si querés llenar la fila entera)
    return ordenados.slice(0, 3);
  }, [events]);

  const availableZones = useMemo(() => {
    const zones = events.map(e => e.locality).filter(Boolean) as string[];
    return ['Todas', ...Array.from(new Set(zones))];
  }, [events]);

  const availableGenres = useMemo(() => {
    const genres = events.map(e => e.musicType).filter(Boolean) as string[];
    return ['Todos', ...Array.from(new Set(genres))];
  }, [events]);

  const availableDates = useMemo(() => {
    const dates = events.map(e => {
      if (!e.date) return null;
      return e.date.split('T')[0]; 
    }).filter(Boolean) as string[];
    
    const uniqueDates = Array.from(new Set(dates)).sort(); 
    return ['Todas', ...uniqueDates];
  }, [events]);

  const formatShortDate = (dateStr: string) => {
    if (dateStr === 'Todas') return 'Todas las fechas';
    try {
      const [year, month, day] = dateStr.split('-');
      const fecha = new Date(Number(year), Number(month) - 1, Number(day));
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${dias[fecha.getDay()]} ${day} ${meses[fecha.getMonth()]}`;
    } catch (e) {
      return dateStr;
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchZone = selectedZone === 'Todas' || event.locality === selectedZone;
      const matchGenre = selectedGenre === 'Todos' || event.musicType === selectedGenre;
      const matchDate = selectedDate === 'Todas' || (event.date && event.date.startsWith(selectedDate));
      
      return matchZone && matchGenre && matchDate;
    });
  }, [events, selectedZone, selectedGenre, selectedDate]);

  const clearFilters = () => {
    setSelectedZone('Todas');
    setSelectedGenre('Todos');
    setSelectedDate('Todas');
  };

  const selectStyles = "w-full appearance-none bg-night-900 border border-night-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors cursor-pointer shadow-sm";

  return (
    <main className="min-h-screen bg-night-900 text-white p-4 sm:p-8">
      
      <div className="max-w-7xl mx-auto mb-10 text-center mt-6 flex flex-col items-center">
        <img 
          src="/logo.png" 
          alt="Jodas Tucumanas Logo" 
          className="h-28 sm:h-36 object-contain mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105 transition-transform duration-300"
        />
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Descubrí la noche en <span className="text-brand-primary">Tucumán</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Encontrá los mejores bailes, recitales y fiestas. Filtrá por zona, género o fecha y armá tu salida perfecta.
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* SECCIÓN RANKING "ALTA JODA" */}
        {topEventos.length > 0 && !loading && selectedZone === 'Todas' && selectedGenre === 'Todos' && selectedDate === 'Todas' && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl text-white shadow-lg shadow-orange-500/20 animate-pulse">
                <Flame size={28} />
              </div>
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                Alta Joda de la Semana
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topEventos.map((evento, index) => (
                <div key={evento.id} className="relative">
                  {/* Etiqueta de Top (Oro, Plata, Bronce) */}
                  <div className={`absolute -top-4 -right-4 z-10 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg border-2 border-night-900
                    ${index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                      index === 1 ? 'bg-gray-300 text-gray-800' : 
                      'bg-amber-700 text-orange-100'}
                  `}>
                    #{index + 1}
                  </div>
                  
                  {/* Tarjeta del evento con un borde especial si es el #1 */}
                  <div className={`h-full rounded-2xl ${index === 0 ? 'ring-2 ring-yellow-400/50 shadow-glow shadow-yellow-500/20' : ''}`}>
                    <EventCard 
                      id={evento.id}
                      title={evento.title}
                      venue={evento.venue}
                      imageUrl={evento.imageUrl}
                      location={evento.location}
                      date={evento.date}
                      musicType={evento.musicType}
                      likes={evento.likes}
                      mediaType={evento.mediaType}
                    />
                  </div>
                </div>
              ))}
            </div>
            <hr className="border-night-700 mt-10 mb-4" />
          </div>
        )}

        {/* BARRA DE FILTROS */}
        <div className="bg-night-800 p-4 sm:p-5 rounded-2xl border border-night-700 shadow-xl mb-10 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row flex-wrap xl:flex-nowrap gap-4 w-full flex-1">
            <div className="relative w-full md:flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary w-5 h-5 pointer-events-none" />
              <select 
                aria-label="Filtrar por fecha"
                title="Filtrar por fecha"
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className={selectStyles}
                style={{ colorScheme: 'dark' }}
              >
                {availableDates.map(date => (
                  <option key={date} value={date} style={{ backgroundColor: '#111827', color: 'white' }}>
                    {formatShortDate(date)}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative w-full md:flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary w-5 h-5 pointer-events-none" />
              <select 
                aria-label="Filtrar por zona"
                title="Filtrar por zona"
                value={selectedZone} 
                onChange={(e) => setSelectedZone(e.target.value)}
                className={selectStyles}
                style={{ colorScheme: 'dark' }}
              >
                {availableZones.map(zone => (
                  <option key={zone} value={zone} style={{ backgroundColor: '#111827', color: 'white' }}>
                    {zone === 'Todas' ? 'Todas las zonas' : zone}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative w-full md:flex-1">
              <Music className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary w-5 h-5 pointer-events-none" />
              <select 
                aria-label="Filtrar por género musical"
                title="Filtrar por género musical"
                value={selectedGenre} 
                onChange={(e) => setSelectedGenre(e.target.value)}
                className={selectStyles}
                style={{ colorScheme: 'dark' }}
              >
                {availableGenres.map(genre => (
                  <option key={genre} value={genre} style={{ backgroundColor: '#111827', color: 'white' }}>
                    {genre === 'Todos' ? 'Todos los géneros' : genre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(selectedZone !== 'Todas' || selectedGenre !== 'Todos' || selectedDate !== 'Todas') && (
            <button 
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-night-900 hover:bg-night-700 px-4 py-3 rounded-xl border border-night-700 transition-colors w-full lg:w-auto justify-center whitespace-nowrap"
            >
              <FilterX size={18} />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Título de Resultados Generales */}
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-white border-b-2 border-brand-primary pb-2 inline-block">
            Cartelera General
          </h2>
          <span className="text-gray-400 text-sm font-medium">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
          </span>
        </div>

        {/* GRILLA DE EVENTOS */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-brand-primary">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="text-gray-400 font-medium">Buscando las mejores jodas...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-400 border border-night-700 rounded-3xl bg-night-800/50 border-dashed">
            <p className="text-lg">Todavía no hay eventos publicados en la cartelera.</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 text-gray-400 border border-night-700 rounded-3xl bg-night-800/50 border-dashed">
            <p className="text-lg mb-4">No encontramos eventos con esos filtros.</p>
            <button 
              onClick={clearFilters}
              className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-primary/90 transition-colors"
            >
              Ver todos los eventos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvents.map((evento) => (
              <EventCard 
                key={evento.id}
                id={evento.id}
                title={evento.title}
                venue={evento.venue}
                imageUrl={evento.imageUrl}
                location={evento.location}
                date={evento.date}
                musicType={evento.musicType}
                rating={evento.rating}
                likes={evento.likes}
                mediaType={evento.mediaType}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}