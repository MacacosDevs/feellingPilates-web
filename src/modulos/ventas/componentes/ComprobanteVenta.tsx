import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

function formatearMoneda(centavos: number): string {
  return `${(centavos / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} MXN`;
}

function formatearFechaVenta(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}

const METODO_PAGO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
};

export interface VentaConfirmada {
  clienteNombre: string;
  folio: string;
  sedeNombre: string;
  fechaIso: string;
  metodoPago: string;
  totalCentavos: number;
  lineas: { nombre: string; cantidad: number; montoCentavos: number }[];
}

export function ComprobanteVenta({ ventaConfirmada, onCerrar }: { ventaConfirmada: VentaConfirmada | null; onCerrar: () => void }) {
  return (
      <Dialog aria-labelledby="comprobante-venta-titulo" open={!!ventaConfirmada} onClose={() => onCerrar()} maxWidth="xs" fullWidth>
        {ventaConfirmada && (
          <>
            <DialogTitle id="comprobante-venta-titulo" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon color="success" />
              Venta registrada
              <IconButton
                onClick={() => onCerrar()}
                sx={{ ml: 'auto' }}
                size="small"
                aria-label="Cerrar"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.25 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    Cliente
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {ventaConfirmada.clienteNombre}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    Folio
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {ventaConfirmada.folio}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.5 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    Sucursal
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {ventaConfirmada.sedeNombre}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    Fecha de venta
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatearFechaVenta(ventaConfirmada.fechaIso)}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 1.5, borderStyle: 'dashed' }} />

              <Stack spacing={1} sx={{ mb: 1.5 }}>
                {ventaConfirmada.lineas.map((linea) => (
                  <Stack key={linea.nombre} direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      {linea.nombre}
                      {linea.cantidad > 1 && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          ×{linea.cantidad}
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatearMoneda(linea.montoCentavos)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Divider sx={{ mb: 1.5, borderStyle: 'dashed' }} />

              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ fontWeight: 700 }}>Total</Typography>
                <Typography sx={{ fontWeight: 700 }}>{formatearMoneda(ventaConfirmada.totalCentavos)}</Typography>
              </Stack>

              <Chip
                size="small"
                variant="outlined"
                color={ventaConfirmada.metodoPago === 'efectivo' ? 'success' : 'info'}
                label={METODO_PAGO_LABEL[ventaConfirmada.metodoPago] ?? ventaConfirmada.metodoPago}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => onCerrar()} variant="contained" fullWidth>
                Listo
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
  );
}
