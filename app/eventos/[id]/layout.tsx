import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    // 1. Reemplazá TU_PROJECT_ID con el ID real de tu proyecto de Firebase
    // Lo podés encontrar en lib/firebase.ts o en la consola de Firebase
    const projectId = "jodas-tucumanas-12345"; // <-- ¡CAMBIÁ ESTO POR TU ID!
    
    // Llamamos a la API REST de Firestore directamente (sin el SDK)
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/eventos/${id}`;
    
    const res = await fetch(url, { 
      next: { revalidate: 60 } // Next.js guarda esto en caché por 60 segundos
    });

    if (res.ok) {
      const data = await res.json();
      
      // La API REST devuelve los datos en un formato especial, hay que extraerlos:
      const title = data.fields.title?.stringValue || 'Evento en Tucumán';
      const venue = data.fields.venue?.stringValue || '';
      const description = data.fields.description?.stringValue || '';
      const imageUrl = data.fields.imageUrl?.stringValue || '';

      const tituloSúperSEO = `🔥 ${title} en ${venue || 'Tucumán'}`;
      const descripcionBreve = description 
        ? description.substring(0, 120) + '...' 
        : `¡No te pierdas esta joda! Conseguí tus entradas y toda la info acá.`;

      return {
        title: tituloSúperSEO,
        description: descripcionBreve,
        openGraph: {
          title: tituloSúperSEO,
          description: descripcionBreve,
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: `Flyer de ${title}`,
            },
          ],
          locale: 'es_AR',
          type: 'website',
          siteName: 'Jodas Tucumanas',
        },
        twitter: {
          card: 'summary_large_image',
          title: tituloSúperSEO,
          description: descripcionBreve,
          images: [imageUrl],
        },
      };
    }
  } catch (error) {
    console.error("Error cargando metadatos SEO:", error);
  }

  return {
    title: 'Joda no encontrada | Jodas Tucumanas',
    description: 'El evento que buscás no existe o fue eliminado.',
  };
}

export default function EventoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}