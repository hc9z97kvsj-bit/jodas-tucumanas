import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export const metadata = {
  title: 'Términos y Condiciones | Jodas Tucumanas',
  description: 'Términos y condiciones de uso de la plataforma Jodas Tucumanas.',
};

export default function TerminosYCondiciones() {
  return (
    <main className="min-h-screen text-white py-10 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto relative z-10">
        
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 bg-night-800/50 p-2 pr-4 rounded-full border border-night-700 backdrop-blur-md"
        >
          <div className="bg-night-800 p-1.5 rounded-full">
            <ArrowLeft size={18} />
          </div>
          <span className="text-sm font-medium">Volver al inicio</span>
        </Link>

        <div className="bg-night-800/90 backdrop-blur-lg border border-night-700 rounded-3xl p-6 sm:p-10 shadow-xl">
          <div className="flex items-center gap-4 mb-8 border-b border-night-700 pb-6">
            <div className="bg-[#D751F5]/20 p-3 rounded-2xl text-[#D751F5] border border-[#D751F5]/30">
              <Scale size={32} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Términos y Condiciones</h1>
              <p className="text-gray-400 mt-1">Última actualización: Mayo 2026</p>
            </div>
          </div>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            
            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-[#D751F5]">1.</span> Naturaleza del Servicio
              </h2>
              <p>
                <strong>Jodas Tucumanas</strong> es una plataforma de carácter estrictamente informativo, diseñada para recopilar y exhibir eventos, recitales, bailes y fiestas en la provincia de Tucumán. No somos organizadores, productores, ni vendedores de entradas de ninguno de los eventos publicados en esta cartelera.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-[#D751F5]">2.</span> Exención de Responsabilidad
              </h2>
              <p>
                Toda la información proporcionada en la plataforma (incluyendo fechas, horarios, ubicaciones, precios y descripciones) es suministrada por terceros (organizadores o relaciones públicas). Por lo tanto, <strong>Jodas Tucumanas no se hace responsable por:</strong>
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-400">
                <li>Cancelaciones o suspensiones de eventos.</li>
                <li>Modificaciones en los horarios, artistas o ubicaciones.</li>
                <li>Derecho de admisión y permanencia aplicado por los locales bailables.</li>
                <li>Inconvenientes, daños o accidentes que puedan ocurrir durante el desarrollo de los eventos.</li>
                <li>Estafas o problemas relacionados con la compra de entradas a través de links o números de WhatsApp provistos en las publicaciones.</li>
              </ul>
              <p className="mt-3">
                Recomendamos siempre verificar la información directamente con el organizador del evento antes de asistir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-[#D751F5]">3.</span> Enlaces a Terceros, Venta de Entradas y Redes Sociales
              </h2>
              <p>
                Nuestra plataforma incluye botones y enlaces que redirigen a plataformas de venta de entradas externas (ej. Passline, NorteTicket), redes sociales (Instagram, Facebook) y servicios de mensajería (WhatsApp). Al respecto, declaramos que:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-400">
                <li><strong>Pagos y Reembolsos:</strong> Jodas Tucumanas actúa únicamente como un puente informativo. No procesamos pagos, no cobramos comisiones por venta de entradas, no retenemos fondos y no gestionamos devoluciones (refunds). Cualquier reclamo financiero debe hacerse a la tiquetera correspondiente o al organizador.</li>
                <li><strong>Contenido de Terceros:</strong> No tenemos control sobre las plataformas externas, la disponibilidad de los tickets, ni el contenido publicado en las redes sociales de los organizadores.</li>
                <li><strong>Privacidad y Datos:</strong> Al hacer clic en estos enlaces, el usuario abandona nuestra plataforma y queda sujeto a los términos, condiciones y políticas de privacidad del sitio de destino.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-[#D751F5]">4.</span> Propiedad Intelectual
              </h2>
              <p>
                Los flyers, imágenes, logotipos y nombres de los eventos son propiedad intelectual de sus respectivos organizadores y creadores. Se utilizan en esta plataforma bajo el concepto de "uso justo" con el único propósito de promoción y difusión. El logo, código y diseño de la plataforma Jodas Tucumanas son propiedad exclusiva de sus desarrolladores.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-[#D751F5]">5.</span> Modificaciones
              </h2>
              <p>
                Nos reservamos el derecho de modificar o actualizar estos Términos y Condiciones en cualquier momento sin previo aviso. El uso continuo de la plataforma después de cualquier cambio constituye su aceptación de los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-[#D751F5]">6.</span> Jurisdicción legal
              </h2>
              <p>
                Estos términos se regirán e interpretarán de acuerdo con las leyes de la República Argentina. Cualquier disputa que surja en relación con el uso de esta plataforma será sometida a la jurisdicción de los tribunales ordinarios de la ciudad de San Miguel de Tucumán, provincia de Tucumán.
              </p>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}