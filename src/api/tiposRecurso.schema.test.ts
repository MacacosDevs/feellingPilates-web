import { describe, expect, it, vi } from 'vitest';
import { ErrorContratoTiposRecurso, validarTiposRecurso } from './tiposRecurso.schema';

const valido = { id: '', nombre: '  categoría arbitraria  ', descripcion: null, activo: false };

describe('Contrato Zod de tipos de recurso', () => {
  it('ZOD01 acepta vacío, cadenas arbitrarias y activo falso sin transformar', () => {
    expect(validarTiposRecurso([])).toEqual([]);
    expect(validarTiposRecurso([valido])).toEqual([valido]);
  });
  it.each(['id', 'nombre', 'descripcion', 'activo'])('ZOD02 exige el campo %s', (campo) => {
    const incompleto: Record<string, unknown> = { ...valido };
    delete incompleto[campo];
    expect(() => validarTiposRecurso([incompleto])).toThrow(ErrorContratoTiposRecurso);
  });
  it.each([
    { id: 1 }, { nombre: false }, { descripcion: {} }, { activo: 'false' },
    { id: null }, { nombre: null }, { activo: null },
  ])('ZOD03/04 rechaza tipos incompatibles sin coerción: %j', (cambio) => {
    expect(() => validarTiposRecurso([{ ...valido, ...cambio }])).toThrow(ErrorContratoTiposRecurso);
  });
  it('ZOD04 admite descripción nula o cadena', () => {
    expect(validarTiposRecurso([valido, { ...valido, descripcion: '' }])).toEqual([valido, { ...valido, descripcion: '' }]);
  });
  it('ZOD05 conserva campos compatibles adicionales y sus valores', () => {
    const extendido = { ...valido, futuro: { lista: [false, null, 'x'] }, contador: 0 };
    expect(validarTiposRecurso([extendido])).toEqual([extendido]);
  });
  it.each([null, {}, 'texto', [valido, { id: 'incompleto' }]])('ZOD06 rechaza el payload completo %j', (payload) => {
    expect(() => validarTiposRecurso(payload)).toThrow(ErrorContratoTiposRecurso);
  });
  it('ZOD07 expone sólo un error fijo sin payload, issues, response, cause ni logs', () => {
    const errorLog = vi.spyOn(console, 'error');
    const warnLog = vi.spyOn(console, 'warn');
    const log = vi.spyOn(console, 'log');
    let error: unknown;
    try { validarTiposRecurso([{ secreto: 'SENTINELA_PAYLOAD_PRIVADO' }]); } catch (caught) { error = caught; }
    expect(error).toBeInstanceOf(ErrorContratoTiposRecurso);
    expect(String(error)).toBe('ErrorContratoTiposRecurso: La respuesta de tipos de recurso no cumple el contrato esperado.');
    for (const campo of ['payload', 'issues', 'response', 'cause']) expect(error).not.toHaveProperty(campo);
    expect(JSON.stringify(error)).not.toContain('SENTINELA_PAYLOAD_PRIVADO');
    expect(errorLog).not.toHaveBeenCalled();
    expect(warnLog).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });
});
