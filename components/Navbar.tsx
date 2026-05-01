import Link from 'next/link';
import { MapPin, Search, User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-night-900/80 backdrop-blur-md border-b border-night-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo / Nombre */}
          <Link href="/" className="flex items-center gap-2">
            <MapPin className="text-brand-primary" size={24} />
            <span className="font-bold text-xl text-white tracking-wide">
              Jodas<span className="text-brand-primary">Tucumanas</span>
            </span>
          </Link>

          {/* Enlaces y Botones */}
          <div className="flex items-center gap-6">
            <Link href="/eventos" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              Explorar
            </Link>
            
            <button 
            aria-label="Buscar eventos"
            title="Buscar eventos"
            className="text-gray-300 hover:text-white transition-colors"
            >
            <Search size={20} />
            </button>

            <Link 
              href="/login" 
              className="flex items-center gap-2 bg-night-800 hover:bg-night-700 text-white px-4 py-2 rounded-lg border border-night-700 transition-all text-sm font-medium"
            >
              <User size={16} />
              <span>Admin</span>
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}