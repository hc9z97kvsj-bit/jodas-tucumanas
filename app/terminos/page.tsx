import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Info,
  Scale,
  ShieldCheck,
  Ticket,
} from 'lucide-react';

export const metadata = {
  title: 'Términos y Condiciones | Jodas Tucumanas',
  description:
    'Condiciones de uso de Jodas Tucumanas y aclaración sobre información de eventos y ventas de entradas de terceros.',
};

const sections = [
  {
    number: '01',
    title: 'Qué es Jodas Tucumanas',
    icon: Info,
    content: (
      <>
        <p>
          <strong>Jodas Tucumanas</strong> es una guía informativa para encontrar
          bailes, fiestas, recitales y otros eventos en Tucumán. Reunimos datos
          y enlaces para facilitar la búsqueda; salvo que una publicación diga
          expresamente lo contrario, no organizamos, producimos ni administramos
          los eventos, y tampoco somos vendedores, revendedores, agentes ni
          representantes de los organizadores o las ticketeras.
        </p>
        <p>
          Mostrar una publicación o un enlace no implica que certifiquemos,
          garanticemos o patrocinemos al evento, al organizador o al vendedor.
        </p>
      </>
    ),
  },
  {
    number: '02',
    title: 'Entradas y compras en sitios externos',
    icon: Ticket,
    content: (
      <>
        <p>
          La página ayuda a encontrar dónde se informa o se venden las entradas.
          Cuando seguís un enlace, la consulta, reserva o compra se realiza
          directamente con la ticketera, el organizador, el boliche u otro
          proveedor indicado en el destino. No vendemos ni emitimos entradas,
          no procesamos pagos, no recibimos el dinero de la compra y no
          gestionamos entregas ni devoluciones.
        </p>
        <p>
          El vendedor y/o el organizador son responsables de sus precios,
          cargos, disponibilidad, condiciones de venta, cobro, entrega y
          reembolso. Antes de pagar, verificá que el sitio o la cuenta sean los
          canales oficiales informados por el evento o el local, y revisá sus
          condiciones. Ante un problema con una compra, contactá directamente a
          quien te vendió la entrada.
        </p>
      </>
    ),
  },
  {
    number: '03',
    title: 'Información de eventos',
    icon: FileText,
    content: (
      <>
        <p>
          La información puede ser enviada por organizadores, locales, artistas
          o colaboradores, o provenir de canales públicos. Intentamos mantenerla
          ordenada y actualizada, pero puede contener errores o quedar
          desactualizada. Fechas, horarios, artistas, direcciones, precios,
          disponibilidad, requisitos de ingreso y demás condiciones pueden
          cambiar sin que recibamos aviso.
        </p>
        <p>
          Confirmá los datos con el organizador o el local antes de viajar,
          asistir o comprar. La publicación en Jodas Tucumanas no reemplaza la
          confirmación del canal oficial.
        </p>
      </>
    ),
  },
  {
    number: '04',
    title: 'Responsabilidad de organizadores y vendedores',
    icon: ShieldCheck,
    content: (
      <>
        <p>
          El organizador, el local y/o el vendedor correspondiente son quienes
          deben responder por la realización y producción del evento, el acceso
          y la seguridad del lugar, la admisión, los cambios o cancelaciones,
          las entradas y cualquier reclamo relacionado con la actividad o la
          compra.
        </p>
        <p>
          Jodas Tucumanas no controla esos servicios ni las plataformas externas
          enlazadas. En la medida permitida por la normativa aplicable, no
          respondemos por incumplimientos, decisiones o contenidos atribuibles
          a terceros. Esta limitación no elimina derechos irrenunciables de las
          personas consumidoras ni excluye responsabilidades que la ley no
          permita limitar.
        </p>
      </>
    ),
  },
  {
    number: '05',
    title: 'Enlaces y servicios de terceros',
    icon: ExternalLink,
    content: (
      <>
        <p>
          Los enlaces pueden llevarte a ticketeras, redes sociales, mapas,
          mensajería u otros servicios que no administramos. Cada proveedor
          establece sus propias condiciones, medidas de seguridad y políticas
          de privacidad. Revisalas antes de operar y evitá compartir información
          sensible si no verificaste que estás en el canal correcto.
        </p>
        <p>
          No somos responsables por la disponibilidad, el contenido, las
          prácticas o el funcionamiento de esos sitios y servicios externos.
        </p>
      </>
    ),
  },
  {
    number: '06',
    title: 'Material publicado y propiedad intelectual',
    icon: FileText,
    content: (
      <>
        <p>
          Los nombres, marcas, fotografías, flyers, videos y demás materiales
          pertenecen a sus respectivos titulares. Su aparición en la guía no
          transfiere esos derechos a Jodas Tucumanas ni significa que seamos sus
          propietarios. Procuramos identificar y difundir el material asociado
          a cada evento con fines informativos.
        </p>
        <p>
          Quien solicita o aporta una publicación declara contar con permiso
          suficiente para compartir ese material. Si sos titular de derechos y
          considerás que un contenido debe corregirse o retirarse, podés
          comunicarte desde la página de{' '}
          <Link
            href="/contacto"
            className="font-bold text-[#b9a5ff] underline decoration-[#66538f] underline-offset-4 hover:text-white"
          >
            contacto
          </Link>{' '}
          e indicar el enlace y el motivo de tu solicitud.
        </p>
      </>
    ),
  },
  {
    number: '07',
    title: 'Uso del sitio y disponibilidad',
    icon: Info,
    content: (
      <>
        <p>
          Usá el sitio de forma lícita y no intentes interferir con su
          funcionamiento, seguridad o disponibilidad. Podemos corregir,
          actualizar, suspender o retirar publicaciones y funciones cuando sea
          necesario, y realizar cambios en la plataforma o en estos términos.
          Publicaremos la versión vigente en esta página. El uso de la
          plataforma supone que pudiste consultar estos términos, sin afectar
          los derechos que te reconoce la normativa aplicable.
        </p>
      </>
    ),
  },
  {
    number: '08',
    title: 'Ley aplicable y derechos de las personas usuarias',
    icon: Scale,
    content: (
      <>
        <p>
          Estos términos se interpretan conforme a las leyes de la República
          Argentina y demás normas que resulten aplicables. Cualquier reclamo
          será atendido por las autoridades y tribunales competentes según las
          reglas legales correspondientes.
        </p>
        <p>
          Nada de lo aquí indicado busca limitar derechos que la normativa
          reconozca como irrenunciables, incluidos los derechos de consumidores y
          usuarios cuando correspondan.
        </p>
      </>
    ),
  },
];

export default function TerminosYCondiciones() {
  return (
    <main className="min-h-screen bg-[#08080d] px-4 py-8 text-[#f4f2fa] sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/"
          className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#292638] bg-[#11111a] px-4 text-sm font-semibold text-[#c8c3d5] hover:border-[#7861bb] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a78bfa]"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Volver al inicio
        </Link>

        <header className="mb-6 rounded-3xl border border-[#292638] bg-[#101019] p-6 sm:p-9">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#57468b] bg-[#1a1728] text-[#b9a5ff]">
              <Scale size={22} aria-hidden="true" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#a78bfa]">
              Jodas Tucumanas · Información legal
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            Términos y Condiciones
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#aaa6b8] sm:text-base">
            Qué ofrece esta guía, quién gestiona los eventos y qué tenés que
            tener en cuenta al abrir enlaces o comprar entradas.
          </p>
          <p className="mt-5 text-xs font-medium text-[#777386]">
            Última actualización: octubre de 2026
          </p>
        </header>

        <aside className="mb-6 rounded-2xl border border-[#61502d] bg-[#1c1912] p-5 sm:p-6">
          <div className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-[#f1c978]">
              <Info size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-white sm:text-base">
                Aviso importante
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#c7c0ae]">
                Estos términos son información general y no constituyen
                asesoramiento legal. Antes de publicarlos como versión
                definitiva, es recomendable que los revise un profesional
                habilitado en la jurisdicción correspondiente.
              </p>
            </div>
          </div>
        </aside>

        <aside className="mb-6 rounded-2xl border border-[#31515b] bg-[#10191d] p-5 sm:p-6">
          <div className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-[#67e8f9]">
              <Info size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-white sm:text-base">
                Encontrás dónde consultar; la compra la hacés con el vendedor
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#b3b7c0]">
                Jodas Tucumanas facilita el acceso a información y enlaces. La
                venta, el cobro de entradas y la realización del evento dependen
                del proveedor y del organizador indicados en cada publicación.
              </p>
            </div>
          </div>
        </aside>

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map(({ number, title, icon: Icon, content }) => (
            <section
              key={number}
              className="rounded-2xl border border-[#292638] bg-[#101019] p-5 sm:p-6"
            >
              <div className="mb-4 flex items-start gap-3 border-b border-[#292638] pb-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#3c315c] bg-[#191626] text-[#b9a5ff]">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-extrabold tracking-[0.18em] text-[#8e7ac5]">
                    {number}
                  </p>
                  <h2 className="mt-1 text-base font-extrabold leading-snug text-white">
                    {title}
                  </h2>
                </div>
              </div>
              <div className="space-y-3 text-sm leading-7 text-[#b7b3c2] [&_strong]:font-bold [&_strong]:text-[#efedf5]">
                {content}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-6 rounded-2xl border border-[#292638] bg-[#0d0d14] p-5 text-xs leading-6 text-[#858193] sm:px-6">
          Estos términos describen el funcionamiento informativo de la
          plataforma; no reemplazan asesoramiento legal ni una política de
          privacidad. Las limitaciones de responsabilidad se aplican solo en la
          medida permitida por la normativa vigente.
        </footer>
      </div>
    </main>
  );
}
