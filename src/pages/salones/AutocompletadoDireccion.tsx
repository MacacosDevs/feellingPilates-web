import { useEffect, useRef, useState } from 'react';
import { Alert, TextField } from '@mui/material';
import { cargarGoogleMaps, tieneGoogleMapsConfigurado } from '../../lib/googleMaps';

export interface DireccionSeleccionada {
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  colonia: string;
  codigoPostal: string;
  ciudad: string;
  estado: string;
  direccionCompleta: string;
  latitud: number;
  longitud: number;
}

function extraerComponente(
  componentes: google.maps.GeocoderAddressComponent[],
  tipo: string,
  usarShortName = false,
): string {
  const componente = componentes.find((c) => c.types.includes(tipo));
  return componente ? (usarShortName ? componente.short_name : componente.long_name) : '';
}

interface AutocompletadoDireccionProps {
  onSeleccionar: (direccion: DireccionSeleccionada) => void;
  valorInicial?: string;
}

export function AutocompletadoDireccion({ onSeleccionar, valorInicial }: AutocompletadoDireccionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!tieneGoogleMapsConfigurado()) {
      setError('Falta configurar VITE_GOOGLE_MAPS_API_KEY para usar el buscador de direcciones.');
      return;
    }
    cargarGoogleMaps()
      .then(() => setListo(true))
      .catch(() => setError('No se pudo cargar Google Maps. Revisa la API key y las restricciones del dominio.'));
  }, []);

  useEffect(() => {
    if (!listo || !inputRef.current || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['address_components', 'formatted_address', 'geometry'],
      types: ['address'],
      componentRestrictions: { country: 'mx' },
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const lugar = autocomplete.getPlace();
      const componentes = lugar.address_components ?? [];
      const ubicacion = lugar.geometry?.location;
      if (!ubicacion) return;

      onSeleccionar({
        calle: extraerComponente(componentes, 'route'),
        numeroExterior: extraerComponente(componentes, 'street_number'),
        numeroInterior: extraerComponente(componentes, 'subpremise'),
        colonia:
          extraerComponente(componentes, 'sublocality') || extraerComponente(componentes, 'neighborhood'),
        codigoPostal: extraerComponente(componentes, 'postal_code'),
        ciudad: extraerComponente(componentes, 'locality'),
        estado: extraerComponente(componentes, 'administrative_area_level_1'),
        direccionCompleta: lugar.formatted_address ?? '',
        latitud: ubicacion.lat(),
        longitud: ubicacion.lng(),
      });
    });

    return () => listener.remove();
  }, [listo, onSeleccionar]);

  return (
    <>
      {error && <Alert severity="warning">{error}</Alert>}
      <TextField
        inputRef={inputRef}
        label="Buscar dirección"
        placeholder="Escribe la calle y número..."
        defaultValue={valorInicial}
        fullWidth
        disabled={!listo}
      />
    </>
  );
}
