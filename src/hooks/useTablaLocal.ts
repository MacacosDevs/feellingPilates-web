import { useEffect, useMemo, useState } from 'react';

/**
 * Ordenamiento + paginación en el cliente para catálogos pequeños que no
 * tienen (o no necesitan) un endpoint paginado en el backend. Misma
 * interacción (TableSortLabel + TablePagination) que las tablas con
 * paginación de servidor, para que el comportamiento sea consistente en
 * toda la app.
 */
export function useTablaLocal<T, Id extends string>(
  filas: T[],
  comparadores: Partial<Record<Id, (a: T, b: T) => number>>,
  ordenInicial: Id,
) {
  const [orderBy, setOrderBy] = useState<Id>(ordenInicial);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [filas]);

  const ordenadas = useMemo(() => {
    const comparador = comparadores[orderBy];
    if (!comparador) return filas;
    const copia = [...filas].sort(comparador);
    return order === 'asc' ? copia : copia.reverse();
  }, [filas, comparadores, orderBy, order]);

  const paginadas = useMemo(
    () => ordenadas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [ordenadas, page, rowsPerPage],
  );

  function onOrdenar(columna: Id) {
    if (orderBy === columna) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(columna);
      setOrder('asc');
    }
  }

  return {
    filas: paginadas,
    total: ordenadas.length,
    orderBy,
    order,
    page,
    rowsPerPage,
    onOrdenar,
    onPageChange: setPage,
    onRowsPerPageChange: (size: number) => {
      setRowsPerPage(size);
      setPage(0);
    },
  };
}
