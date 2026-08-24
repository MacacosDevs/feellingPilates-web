const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

let cargaPromesa: Promise<void> | null = null;

export function tieneGoogleMapsConfigurado(): boolean {
  return Boolean(API_KEY);
}

export function cargarGoogleMaps(): Promise<void> {
  if (!API_KEY) {
    return Promise.reject(new Error('Falta VITE_GOOGLE_MAPS_API_KEY'));
  }
  if (cargaPromesa) return cargaPromesa;

  cargaPromesa = new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }
    const nombreCallback = '__cargarGoogleMapsCallback';
    (window as unknown as Record<string, () => void>)[nombreCallback] = () => resolve();

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=${nombreCallback}`;
    script.async = true;
    script.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
    document.head.appendChild(script);
  });

  return cargaPromesa;
}

export function urlMapaEmbebido(latitud: number, longitud: number, ubicacionPrecisa = true): string {
  const coordenadas = `${latitud},${longitud}`;
  if (ubicacionPrecisa) {
    // Modo "place" dibuja un marcador exacto; "view" solo centra sin pin.
    return `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${coordenadas}&zoom=16`;
  }
  return `https://www.google.com/maps/embed/v1/view?key=${API_KEY}&center=${coordenadas}&zoom=12`;
}

declare global {
  interface Window {
    google?: typeof google;
  }
}
