import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { listarTiposRecurso } from './catalogos';
import { apiClient } from './client';
import { ErrorContratoTiposRecurso } from './tiposRecurso.schema';
import { api, server } from '../../tests/support/session';

describe('GET tipos-recurso: frontera runtime real', () => {
  it('proyecta DTO validado sin cambiar cadenas, nulos, falso ni extras', async () => {
    const payload = [{ id: '', nombre: '  ', descripcion: null, activo: false, futuro: ['x', null] }];
    server.use(http.get(`${api}/tipos-recurso`, () => HttpResponse.json(payload)));
    expect(await listarTiposRecurso()).toEqual(payload);
  });
  it('rechaza respuesta HTTP exitosa con contrato inválido', async () => {
    server.use(http.get(`${api}/tipos-recurso`, () => HttpResponse.json([{ id: 'r', nombre: 'Equipo', activo: true }])));
    await expect(listarTiposRecurso()).rejects.toBeInstanceOf(ErrorContratoTiposRecurso);
  });
  it('ZOD07 conserva el mismo objeto de error de transporte sin envolverlo', async () => {
    const original = new AxiosError('Transporte original', 'ERR_NETWORK');
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(original);
    await expect(listarTiposRecurso()).rejects.toBe(original);
  });
});
