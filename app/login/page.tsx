'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirigir si ya está logueado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/admin');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Credenciales incorrectas. Verificá los datos.');
      } else {
        setError('Error al intentar iniciar sesión. Reintentá en un momento.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center p-4">
      
      {/* Botón para volver al inicio */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Volver al inicio</span>
      </Link>

      <div className="w-full max-w-md">
        {/* Logo o Título */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-white">
            ADMIN<span className="text-[#D751F5]">PANEL</span>
          </h1>
          <p className="text-gray-400 mt-2">Ingresá para gestionar la cartelera</p>
        </div>

        {/* Tarjeta del Formulario */}
        <div className="bg-night-800/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Campo Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jodastucumanas.com"
                  className="w-full bg-night-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#D751F5] focus:ring-1 focus:ring-[#D751F5] transition-all"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-night-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#D751F5] focus:ring-1 focus:ring-[#D751F5] transition-all"
                />
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Botón de Ingreso */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D751F5] to-[#FF0A23] text-white font-bold py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(215,81,245,0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>

          </form>
        </div>

        {/* Decoración Inferior */}
        <p className="text-center mt-8 text-gray-500 text-sm">
          Acceso restringido para administradores autorizados.
        </p>
      </div>
    </main>
  );
}