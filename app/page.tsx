'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EventCard from '@/components/EventCard';
import StarBorder from '@/components/StarBorder';
import Link from 'next/link';
import { Loader2, MapPin, Music, FilterX, Calendar, Flame } from 'lucide-react';

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

  const topEventos = useMemo(() => {
    const eventosConLikes = events.filter(e => Number(e.likes || 0) > 0);
    const ordenados = eventosConLikes.sort((a, b) => Number(b.likes || 0) - Number(a.likes || 0));
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
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
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
                <div key={evento.id} className="relative h-full">
                  <div className={`absolute -top-4 -right-4 z-[50] w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-xl border-4 border-night-900
                    ${index === 0 ? 'bg-yellow-400 text-yellow-900 shadow-yellow-500/50' : 
                      index === 1 ? 'bg-gray-300 text-gray-800' : 
                      'bg-amber-700 text-orange-100'}
                  `}>
                    #{index + 1}
                  </div>
                  
                  {index === 0 ? (
                    <StarBorder as="div" color="#f97316" speed="4s" thickness={3} className="h-full w-full">
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
                    </StarBorder>
                  ) : (
                    <div className="h-full rounded-2xl">
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
                  )}
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
              <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={`${selectStyles} [color-scheme:dark]`}>
                {availableDates.map(date => (
                  <option key={date} value={date} className="bg-night-900 text-white">{formatShortDate(date)}</option>
                ))}
              </select>
            </div>
            <div className="relative w-full md:flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary w-5 h-5 pointer-events-none" />
              <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className={`${selectStyles} [color-scheme:dark]`}>
                {availableZones.map(zone => (
                  <option key={zone} value={zone} className="bg-night-900 text-white">{zone === 'Todas' ? 'Todas las zonas' : zone}</option>
                ))}
              </select>
            </div>
            <div className="relative w-full md:flex-1">
              <Music className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary w-5 h-5 pointer-events-none" />
              <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className={`${selectStyles} [color-scheme:dark]`}>
                {availableGenres.map(genre => (
                  <option key={genre} value={genre} className="bg-night-900 text-white">{genre === 'Todos' ? 'Todos los géneros' : genre}</option>
                ))}
              </select>
            </div>
          </div>
          {(selectedZone !== 'Todas' || selectedGenre !== 'Todos' || selectedDate !== 'Todas') && (
            <button onClick={clearFilters} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-night-900 hover:bg-night-700 px-4 py-3 rounded-xl border border-night-700 transition-colors w-full lg:w-auto justify-center whitespace-nowrap">
              <FilterX size={18} /> Limpiar filtros
            </button>
          )}
        </div>

        {/* Resultados Generales */}
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-white border-b-2 border-brand-primary pb-2 inline-block">Cartelera General</h2>
          <span className="text-gray-400 text-sm font-medium">{filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}</span>
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
            <button onClick={clearFilters} className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-primary/90 transition-colors">
              Ver todos los eventos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvents.map((evento) => (
              <EventCard key={evento.id} {...evento} />
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto mt-20 pt-8 border-t border-night-700 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Jodas Tucumanas. Todos los derechos reservados.</p>
        <div className="flex items-center gap-6">
          <Link href="/terminos" className="hover:text-brand-primary transition-colors">Términos y Condiciones</Link>
          <a href="#" className="hover:text-brand-primary transition-colors">Contacto</a>
        </div>
      </footer>
    </main>
  );
}