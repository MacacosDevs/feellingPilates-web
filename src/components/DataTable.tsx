import { Fragment, type ReactNode } from 'react';
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';

export interface ColumnaTabla<Id extends string = string> {
  id: Id;
  label: string;
  align?: 'left' | 'right' | 'center';
  ordenable?: boolean;
  width?: number | string;
}

export interface PaginacionTabla {
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (size: number) => void;
  rowsPerPageOptions?: number[];
}

interface DataTableProps<T, Id extends string = string> {
  columnas: ColumnaTabla<Id>[];
  filas: T[];
  obtenerClave: (fila: T) => string;
  renderFila: (fila: T) => ReactNode;
  cargando?: boolean;
  ordenPor?: Id;
  orden?: 'asc' | 'desc';
  onOrdenar?: (columna: Id) => void;
  iconoVacio?: ReactNode;
  textoVacio: string;
  paginacion?: PaginacionTabla;
  size?: 'small' | 'medium';
  /** Tope opcional de alto para el área de filas. Sin esto, la tabla llena el espacio flexible que le dé su contenedor (ver PaginaConTabla). */
  maxHeight?: number | string;
}

/**
 * Contenedor de tabla normalizado: encabezado ordenable, filas skeleton
 * mientras carga, estado vacío con ícono, y paginación de servidor opcional.
 * Cada fila la arma el caller (renderFila) para mantener flexibilidad en
 * el contenido de las celdas (avatares, chips, acciones, etc.).
 */
export function DataTable<T, Id extends string = string>({
  columnas,
  filas,
  obtenerClave,
  renderFila,
  cargando = false,
  ordenPor,
  orden = 'asc',
  onOrdenar,
  iconoVacio,
  textoVacio,
  paginacion,
  size = 'small',
  maxHeight,
}: DataTableProps<T, Id>) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderRadius: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', ...(maxHeight ? { maxHeight } : {}) }}>
        <Table size={size} stickyHeader>
          <TableHead>
            <TableRow>
              {columnas.map((columna) => (
                <TableCell
                  key={columna.id}
                  align={columna.align}
                  width={columna.width}
                  sx={{ fontWeight: 700, bgcolor: 'grey.100' }}
                >
                  {columna.ordenable && onOrdenar ? (
                    <TableSortLabel
                      active={ordenPor === columna.id}
                      direction={ordenPor === columna.id ? orden : 'asc'}
                      onClick={() => onOrdenar(columna.id)}
                    >
                      {columna.label}
                    </TableSortLabel>
                  ) : (
                    columna.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell colSpan={columnas.length} sx={{ border: 0 }}>
                  <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={28} />
                  </Box>
                </TableCell>
              </TableRow>
            ) : filas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnas.length} sx={{ border: 0 }}>
                  <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    {iconoVacio}
                    <Typography color="text.secondary">{textoVacio}</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filas.map((fila) => <Fragment key={obtenerClave(fila)}>{renderFila(fila)}</Fragment>)
            )}
          </TableBody>
        </Table>
      </Box>

      {paginacion && (
        <TablePagination
          component="div"
          count={paginacion.total}
          page={paginacion.page}
          onPageChange={(_, nuevaPagina) => paginacion.onPageChange(nuevaPagina)}
          rowsPerPage={paginacion.rowsPerPage}
          onRowsPerPageChange={
            paginacion.onRowsPerPageChange
              ? (e) => paginacion.onRowsPerPageChange!(parseInt(e.target.value, 10))
              : undefined
          }
          rowsPerPageOptions={paginacion.rowsPerPageOptions ?? [10, 25, 50]}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{ borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}
        />
      )}
    </TableContainer>
  );
}
