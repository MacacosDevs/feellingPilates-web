import { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { cargarGoogleMaps } from '../../lib/googleMaps';

interface MapaInteractivoProps {
  latitud: number;
  longitud: number;
  zoom: number;
  onMover: (latitud: number, longitud: number) => void;
}

export function MapaInteractivo({ latitud, longitud, zoom, onMover }: MapaInteractivoProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<google.maps.Map | null>(null);
  const marcadorRef = useRef<google.maps.Marker | null>(null);
  const onMoverRef = useRef(onMover);
  onMoverRef.current = onMover;

  useEffect(() => {
    let cancelado = false;

    cargarGoogleMaps().then(() => {
      if (cancelado || !contenedorRef.current || mapaRef.current) return;

      const mapa = new google.maps.Map(contenedorRef.current, {
        center: { lat: latitud, lng: longitud },
        zoom,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      const marcador = new google.maps.Marker({
        position: { lat: latitud, lng: longitud },
        map: mapa,
        draggable: true,
      });

      marcador.addListener('dragend', () => {
        const posicion = marcador.getPosition();
        if (posicion) onMoverRef.current(posicion.lat(), posicion.lng());
      });

      mapaRef.current = mapa;
      marcadorRef.current = marcador;
    });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapaRef.current || !marcadorRef.current) return;
    const posicionActual = marcadorRef.current.getPosition();
    if (posicionActual && posicionActual.lat() === latitud && posicionActual.lng() === longitud) return;

    const nuevaPosicion = { lat: latitud, lng: longitud };
    marcadorRef.current.setPosition(nuevaPosicion);
    mapaRef.current.panTo(nuevaPosicion);
    mapaRef.current.setZoom(zoom);
  }, [latitud, longitud, zoom]);

  return (
    <Box>
      <Box ref={contenedorRef} sx={{ width: '100%', height: 220, borderRadius: 2, overflow: 'hidden' }} />
      <Typography variant="caption" color="text.secondary">
        Arrastra el marcador para ajustar la ubicación exacta.
      </Typography>
    </Box>
  );
}
