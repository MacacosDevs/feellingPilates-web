import { z } from 'zod';
import type { TipoRecursoResponse } from './types';

const tiposRecursoSchema = z.array(z.looseObject({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  activo: z.boolean(),
}));

export class ErrorContratoTiposRecurso extends Error {
  constructor() {
    super('La respuesta de tipos de recurso no cumple el contrato esperado.');
    this.name = 'ErrorContratoTiposRecurso';
  }
}

export function validarTiposRecurso(payload: unknown): TipoRecursoResponse[] {
  const resultado = tiposRecursoSchema.safeParse(payload);
  if (!resultado.success) throw new ErrorContratoTiposRecurso();
  return resultado.data.map((item) => ({
    ...item,
    id: item.id,
    nombre: item.nombre,
    descripcion: item.descripcion,
    activo: item.activo,
  }));
}
