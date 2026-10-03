import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { CalendarioHorariosInstructor } from '../../../modulos/programacion/componentes/CalendarioHorariosInstructor';
import { renderWithTheme } from '../../../components/test-support/renderWithTheme';
import { choose, deferred } from '../../../components/test-support/regression';
import { activities, salon, turno } from '../../../../tests/fixtures/regression';
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026, 8, 16, 23, 30)); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
type Props = ComponentProps<typeof CalendarioHorariosInstructor>;
function props(overrides: Partial<Props> = {}): Props {
    return { horarios: salon().horarios, turnosRecurrentes: [turno()], turnosPuntuales: [], instructoresSalon: [{ id: 'i1', nombre: 'Inés Prueba' }, { id: 'i2', nombre: 'Luz Prueba' }], actividadesSalon: activities, mapaEspecialidades: { i1: ['a1'], i2: ['a2'] }, inicioSemana: new Date(2026, 8, 13), excepciones: [], puedeGestionar: true, puedeEditar: false, puedeCancelar: false, puedeAdministrarSalon: true, onCrear: vi.fn(), onMover: vi.fn().mockResolvedValue(null), onAjustarFecha: vi.fn().mockResolvedValue(null), onEliminar: vi.fn(), onCancelarFecha: vi.fn(), onGuardarExcepcion: vi.fn(), onEliminarExcepcion: vi.fn(), ...overrides };
}
async function edit() { await userEvent.click(screen.getByRole('button', { name: 'Editar actividades e instructores' })); return screen.getByRole('dialog', { name: /Instructores y actividades/ }); }
async function addLuz() { await choose('Agregar instructor', 'Luz Prueba'); await choose('Actividades', /Yoga/); await userEvent.keyboard('{Escape}'); }

type VistaCalendario = ReturnType<typeof renderWithTheme>;
type EscuchadorRaton = EventListenerOrEventListenerObject;

function columnaCalendario(vista: VistaCalendario, indice: number): HTMLElement {
    const cabeceras = vista.container.querySelectorAll('.dia-header');
    const rejilla = cabeceras[0].parentElement!.nextElementSibling!.children[1];
    return Array.from(rejilla.children).slice(-cabeceras.length)[indice] as HTMLElement;
}

function zonaCreacion(vista: VistaCalendario, indiceDia = 0): HTMLElement {
    return columnaCalendario(vista, indiceDia).firstElementChild as HTMLElement;
}

function bloqueRecurrente(): HTMLElement {
    return screen.getByText('09:00–11:00').parentElement as HTMLElement;
}

function bloquePuntual(): HTMLElement {
    return screen.getByText('12:00–13:00').parentElement!.parentElement as HTMLElement;
}

function vigilarEscuchadoresRaton() {
    const agregar = vi.spyOn(window, 'addEventListener');
    const quitar = vi.spyOn(window, 'removeEventListener');
    const altas = () => agregar.mock.calls.filter(([tipo]) => tipo === 'mousemove' || tipo === 'mouseup');
    const bajas = () => quitar.mock.calls.filter(([tipo]) => tipo === 'mousemove' || tipo === 'mouseup');
    const identidades = () => {
        expect(altas()).toHaveLength(2);
        expect(altas().map(([tipo]) => tipo)).toEqual(['mousemove', 'mouseup']);
        return {
            mover: altas()[0][1] as EscuchadorRaton,
            soltar: altas()[1][1] as EscuchadorRaton,
        };
    };
    const esperarBajaExacta = ({ mover, soltar }: { mover: EscuchadorRaton; soltar: EscuchadorRaton }) => {
        expect(bajas()).toEqual([
            ['mousemove', mover],
            ['mouseup', soltar],
        ]);
    };
    return { agregar, quitar, altas, bajas, identidades, esperarBajaExacta };
}

function invocarEscuchadorRaton(escuchador: EscuchadorRaton, tipo: 'mousemove' | 'mouseup', clientX: number, clientY: number) {
    const evento = new MouseEvent(tipo, { clientX, clientY });
    act(() => {
        if (typeof escuchador === 'function') escuchador(evento);
        else escuchador.handleEvent(evento);
    });
}

function excepcionPuntual() {
    return turno({ id: 'e1', tipo: 'EXCEPCION', diaSemana: null, fecha: '2026-09-16', horaInicio: '12:00:00', horaFin: '13:00:00' });
}
describe('Calendario: contratos de asignación y permisos', () => {
    it('mantiene independientes la fecha y el recurrente, y reinicia cambios al reabrir', async () => {
        renderWithTheme(<CalendarioHorariosInstructor {...props()}/>);
        let dialog = await edit();
        expect(within(dialog).queryByText('Inés Prueba')).toBeNull();
        await addLuz();
        await userEvent.click(screen.getByRole('button', { name: /Repetitivo/ }));
        expect(within(dialog).getByText('Inés Prueba')).toBeTruthy();
        expect(within(dialog).queryByText('Luz Prueba')).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: /Solo Mié/ }));
        expect(within(dialog).getByText('Luz Prueba')).toBeTruthy();
        await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        dialog = await edit();
        expect(within(dialog).queryByText('Luz Prueba')).toBeNull();
    });
    it('limita actividades a especialidades y mapea lapso válido; pendientes, error y reintento resueltos', async () => {
        const pending = deferred<string | null>();
        const p = props({ onMover: vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValueOnce(null) });
        renderWithTheme(<CalendarioHorariosInstructor {...p}/>);
        await edit();
        await userEvent.click(screen.getByRole('button', { name: /Repetitivo/ }));
        await userEvent.click(screen.getByRole('combobox', { name: 'Actividades' }));
        expect(screen.getByRole('option', { name: /Pilates/ })).toBeTruthy();
        expect(screen.queryByRole('option', { name: /Yoga/ })).toBeNull();
        await userEvent.keyboard('{Escape}');
        await userEvent.click(screen.getByRole('button', { name: 'Solo un lapso' }));
        fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '09:30' } });
        fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '10:30' } });
        await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
        expect(p.onMover).toHaveBeenCalledExactlyOnceWith('t1', 3, '09:00:00', '11:00:00', [{ instructorId: 'i1', tipoActividadIds: ['a1'], horaInicio: '09:30', horaFin: '10:30' }], true);
        expect((screen.getByRole('button', { name: 'Guardando…' }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(true);
        pending.resolve('Conflicto sintético');
        expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Conflicto sintético');
        expect((screen.getByLabelText('Desde') as HTMLInputElement).value).toBe('09:30');
        await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(p.onMover).toHaveBeenCalledTimes(2);
    });
    it.each([['10:30', '10:00'], ['08:30', '10:00'], ['10:00', '11:30'], ['', '10:00']])('no guarda lapso inválido %s–%s en edición', async (start, end) => {
        const p = props();
        renderWithTheme(<CalendarioHorariosInstructor {...p}/>);
        await edit();
        await userEvent.click(screen.getByRole('button', { name: /Repetitivo/ }));
        await userEvent.click(screen.getByRole('button', { name: 'Solo un lapso' }));
        fireEvent.change(screen.getByLabelText('Desde'), { target: { value: start } });
        fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: end } });
        expect((screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement).disabled).toBe(true);
        expect(p.onMover).not.toHaveBeenCalled();
    });
    it('guarda fecha con asignaciones propias y null para horario completo', async () => {
        const p = props();
        renderWithTheme(<CalendarioHorariosInstructor {...p}/>);
        await edit();
        await addLuz();
        await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
        expect(p.onAjustarFecha).toHaveBeenCalledExactlyOnceWith('2026-09-16', [{ horaInicio: '09:00', horaFin: '11:00', asignaciones: [{ instructorId: 'i2', tipoActividadIds: ['a2'], horaInicio: null, horaFin: null }] }], [], true);
        expect(p.onMover).not.toHaveBeenCalled();
    });
    it('hidrata excepción existente sin contaminar recurrente y reemplaza su id', async () => {
        const ex = turno({ id: 'e1', tipo: 'EXCEPCION', diaSemana: null, fecha: '2026-09-16' });
        const p = props({ turnosPuntuales: [ex] });
        renderWithTheme(<CalendarioHorariosInstructor {...p}/>);
        await edit();
        expect(screen.getByRole('combobox', { name: 'Actividades' }).textContent).toContain('Pilates');
        await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
        expect(p.onAjustarFecha).toHaveBeenCalledExactlyOnceWith('2026-09-16', [{ horaInicio: '09:00', horaFin: '11:00', asignaciones: [{ instructorId: 'i1', tipoActividadIds: ['a1'], horaInicio: null, horaFin: null }] }], ['e1'], true);
    });
    it.each([
        [false, false, false, false, false, false, false],
        [false, true, false, false, true, false, false],
        [false, false, true, false, false, true, false],
        [true, false, false, false, true, true, true],
        [false, false, false, true, false, false, false],
    ])('permiso gestionar=%s editar=%s cancelar=%s administrar=%s', (manage, editPermission, cancel, admin, canEdit, canCancel, canDelete) => {
        renderWithTheme(<CalendarioHorariosInstructor {...props({ puedeGestionar: manage, puedeEditar: editPermission, puedeCancelar: cancel, puedeAdministrarSalon: admin })}/>);
        expect(!!screen.queryByRole('button', { name: 'Editar actividades e instructores' })).toBe(canEdit);
        expect(!!screen.queryByRole('button', { name: 'Cancelar un día puntual' })).toBe(canCancel);
        expect(!!screen.queryByRole('button', { name: 'Eliminar bloque completo' })).toBe(canDelete);
        fireEvent.click(screen.getByText('Mié 16/9'));
        expect(!!screen.queryByText('Horario de este día')).toBe(admin);
    });
    it('cancela fecha local e instructores; eliminar requiere confirmación y usa id', async () => {
        const p = props();
        renderWithTheme(<CalendarioHorariosInstructor {...p}/>);
        await userEvent.click(screen.getByRole('button', { name: 'Cancelar un día puntual' }));
        expect((screen.getByLabelText('Fecha') as HTMLInputElement).value).toBe('2026-09-16');
        fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-09-20' } });
        await userEvent.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));
        expect(p.onCancelarFecha).toHaveBeenCalledExactlyOnceWith('2026-09-20', ['i1']);
        await userEvent.click(screen.getByRole('button', { name: 'Eliminar bloque completo' }));
        expect(p.onEliminar).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
        expect(p.onEliminar).toHaveBeenCalledExactlyOnceWith('t1');
    });
    it.each([false, true])('operación especial cerrado=%s conserva fecha y callbacks', async (closed) => {
        const p = props();
        renderWithTheme(<CalendarioHorariosInstructor {...p}/>);
        fireEvent.click(screen.getByText('Mié 16/9'));
        if (closed)
            await userEvent.click(screen.getByRole('button', { name: 'Cerrado' }));
        else {
            fireEvent.change(screen.getByLabelText('Abre'), { target: { value: '10:00' } });
            fireEvent.change(screen.getByLabelText('Cierra'), { target: { value: '17:00' } });
        }
        await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
        expect(p.onGuardarExcepcion).toHaveBeenCalledExactlyOnceWith('2026-09-16', closed, closed ? null : '10:00', closed ? null : '17:00');
    });
    it('quita excepción de operación por id y admite calendario sin días', async () => {
        const p = props({ excepciones: [{ id: 'op1', fecha: '2026-09-16', cerrado: true, horaApertura: null, horaCierre: null }] });
        const view = renderWithTheme(<CalendarioHorariosInstructor {...p}/>);
        fireEvent.click(screen.getByText('Mié 16/9'));
        await userEvent.click(screen.getByRole('button', { name: 'Quitar excepción' }));
        expect(p.onEliminarExcepcion).toHaveBeenCalledExactlyOnceWith('op1');
        view.unmount();
        renderWithTheme(<CalendarioHorariosInstructor {...p} horarios={[]}/>);
        expect(screen.getByText(/no tiene días de atención configurados/)).toBeTruthy();
    });
    it('fecha pendiente conserva asignaciones ante error resuelto y reintenta sin escribir recurrente', async () => {
        const hold = deferred<string | null>();
        const callback = vi.fn().mockReturnValueOnce(hold.promise).mockResolvedValueOnce(null);
        const p = props({ onAjustarFecha: callback });
        renderWithTheme(<CalendarioHorariosInstructor {...p}/>);
        await edit();
        await addLuz();
        await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
        expect((screen.getByRole('button', { name: 'Guardando…' }) as HTMLButtonElement).disabled).toBe(true);
        hold.resolve('Fecha en conflicto');
        await screen.findByText('Fecha en conflicto');
        expect(screen.getByRole('combobox', { name: 'Actividades' }).textContent).toBe('Yoga');
        expect(p.onMover).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(1);
        await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(callback).toHaveBeenCalledTimes(2);
    });
    it('retirar todos los instructores puntuales elimina sólo la excepción existente', async () => {
        const p = props({ turnosPuntuales: [turno({ id: 'e1', tipo: 'EXCEPCION', fecha: '2026-09-16', diaSemana: null })] });
        renderWithTheme(<CalendarioHorariosInstructor {...p}/>);
        const dialog = await edit();
        // Unnamed instructor delete: its row is anchored by the Activities label.
        const row = within(dialog).getByRole('combobox', { name: 'Actividades' }).closest('.MuiFormControl-root')!.parentElement!.parentElement!;
        await userEvent.click(within(row).getAllByRole('button').at(-1)!);
        await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));
        expect(p.onEliminar).toHaveBeenCalledExactlyOnceWith('e1');
        expect(p.onMover).not.toHaveBeenCalled();
        expect(p.onAjustarFecha).not.toHaveBeenCalled();
    });
    it('sin turnos con días válidos mantiene encabezados y consulta regular', () => {
        renderWithTheme(<CalendarioHorariosInstructor {...props({ turnosRecurrentes: [], puedeGestionar: false, puedeAdministrarSalon: false })}/>);
        expect(screen.getByText('Mié 16/9')).toBeTruthy();
        expect(screen.getByText('Solo puedes consultar este calendario.')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Eliminar bloque completo' })).toBeNull();
    });
});

describe('Calendario: ciclo de vida de interacciones globales', () => {
    it('creación registra y retira las identidades exactas, y conserva el request al confirmar', async () => {
        const p = props();
        const vista = renderWithTheme(<CalendarioHorariosInstructor {...p}/>);
        const listeners = vigilarEscuchadoresRaton();

        fireEvent.mouseDown(zonaCreacion(vista), { clientX: 20, clientY: 120 });
        const identidades = listeners.identidades();
        fireEvent.mouseMove(window, { clientX: 20, clientY: 184 });
        fireEvent.mouseUp(window, { clientX: 20, clientY: 184 });

        listeners.esperarBajaExacta(identidades);
        expect(p.onCrear).not.toHaveBeenCalled();
        await choose('Agregar instructor', 'Inés Prueba');
        await choose('Actividades', /Pilates/);
        await userEvent.keyboard('{Escape}');
        await userEvent.click(screen.getByRole('button', { name: 'Crear horario' }));
        expect(p.onCrear).toHaveBeenCalledExactlyOnceWith('RECURRENTE', 0, null, '10:00', '11:00', [{ instructorId: 'i1', tipoActividadIds: ['a1'], horaInicio: null, horaFin: null }]);
    });

    it('movimiento recurrente registra y retira las identidades exactas, y conserva el callback con limpieza idempotente', () => {
        const p = props();
        const vista = renderWithTheme(<CalendarioHorariosInstructor {...p}/>);
        const listeners = vigilarEscuchadoresRaton();

        fireEvent.mouseDown(bloqueRecurrente(), { clientX: 100, clientY: 64 });
        const identidades = listeners.identidades();
        fireEvent.mouseMove(window, { clientX: 100, clientY: 96 });
        fireEvent.mouseUp(window, { clientX: 100, clientY: 96 });

        listeners.esperarBajaExacta(identidades);
        expect(p.onMover).toHaveBeenCalledExactlyOnceWith('t1', 3, '09:30', '11:30', [{ instructorId: 'i1', tipoActividadIds: ['a1'], horaInicio: null, horaFin: null }]);
        vista.unmount();
        invocarEscuchadorRaton(identidades.soltar, 'mouseup', 100, 128);
        invocarEscuchadorRaton(identidades.soltar, 'mouseup', 100, 160);
        listeners.esperarBajaExacta(identidades);
        expect(p.onMover).toHaveBeenCalledExactlyOnceWith('t1', 3, '09:30', '11:30', [{ instructorId: 'i1', tipoActividadIds: ['a1'], horaInicio: null, horaFin: null }]);
    });

    it('movimiento puntual registra y retira las identidades exactas, y conserva el request por fecha', () => {
        const p = props({ turnosPuntuales: [excepcionPuntual()] });
        renderWithTheme(<CalendarioHorariosInstructor {...p}/>);
        const listeners = vigilarEscuchadoresRaton();

        fireEvent.mouseDown(bloquePuntual(), { clientX: 100, clientY: 256 });
        const identidades = listeners.identidades();
        fireEvent.mouseMove(window, { clientX: 100, clientY: 288 });
        fireEvent.mouseUp(window, { clientX: 100, clientY: 288 });

        listeners.esperarBajaExacta(identidades);
        expect(p.onAjustarFecha).toHaveBeenCalledExactlyOnceWith('2026-09-16', [{ horaInicio: '12:30', horaFin: '13:30', asignaciones: [{ instructorId: 'i1', tipoActividadIds: ['a1'], horaInicio: null, horaFin: null }] }], ['e1']);
    });

    it('desmonta sin fugas tras inicios repetidos de los tres flujos', () => {
        const casos = [
            { preparar: () => props(), iniciar: (vista: VistaCalendario) => fireEvent.mouseDown(zonaCreacion(vista), { clientY: 120 }) },
            { preparar: () => props(), iniciar: () => fireEvent.mouseDown(bloqueRecurrente(), { clientY: 64 }) },
            { preparar: () => props({ turnosPuntuales: [excepcionPuntual()] }), iniciar: () => fireEvent.mouseDown(bloquePuntual(), { clientY: 256 }) },
        ];

        for (const caso of casos) {
            for (let repeticion = 0; repeticion < 2; repeticion += 1) {
                const p = caso.preparar();
                const vista = renderWithTheme(<CalendarioHorariosInstructor {...p}/>);
                const listeners = vigilarEscuchadoresRaton();
                caso.iniciar(vista);
                const identidades = listeners.identidades();
                vista.unmount();
                listeners.esperarBajaExacta(identidades);
                invocarEscuchadorRaton(identidades.mover, 'mousemove', 200, 352);
                invocarEscuchadorRaton(identidades.soltar, 'mouseup', 200, 352);
                invocarEscuchadorRaton(identidades.soltar, 'mouseup', 200, 384);
                listeners.esperarBajaExacta(identidades);
                expect(screen.queryByRole('dialog')).toBeNull();
                expect(p.onCrear).not.toHaveBeenCalled();
                expect(p.onMover).not.toHaveBeenCalled();
                expect(p.onAjustarFecha).not.toHaveBeenCalled();
                listeners.agregar.mockRestore();
                listeners.quitar.mockRestore();
            }
        }
    });

    it('al superseder cada flujo sus wrappers obsoletos no actúan y sólo concluye la interacción vigente', () => {
        const casos = [
            {
                anterior: (vista: VistaCalendario) => fireEvent.mouseDown(zonaCreacion(vista), { clientX: 20, clientY: 120 }),
                vigente: () => fireEvent.mouseDown(bloqueRecurrente(), { clientX: 100, clientY: 64 }),
                moverVigente: { clientX: 100, clientY: 96 },
                comprobar: (p: Props) => {
                    expect(screen.queryByText('Nuevo horario')).toBeNull();
                    expect(p.onCrear).not.toHaveBeenCalled();
                    expect(p.onMover).toHaveBeenCalledExactlyOnceWith('t1', 3, '09:30', '11:30', [{ instructorId: 'i1', tipoActividadIds: ['a1'], horaInicio: null, horaFin: null }]);
                    expect(p.onAjustarFecha).not.toHaveBeenCalled();
                },
            },
            {
                anterior: () => fireEvent.mouseDown(bloqueRecurrente(), { clientX: 100, clientY: 64 }),
                vigente: () => fireEvent.mouseDown(bloquePuntual(), { clientX: 100, clientY: 256 }),
                moverVigente: { clientX: 100, clientY: 288 },
                comprobar: (p: Props) => {
                    expect(p.onCrear).not.toHaveBeenCalled();
                    expect(p.onMover).not.toHaveBeenCalled();
                    expect(p.onAjustarFecha).toHaveBeenCalledExactlyOnceWith('2026-09-16', [{ horaInicio: '12:30', horaFin: '13:30', asignaciones: [{ instructorId: 'i1', tipoActividadIds: ['a1'], horaInicio: null, horaFin: null }] }], ['e1']);
                },
            },
            {
                anterior: () => fireEvent.mouseDown(bloquePuntual(), { clientX: 100, clientY: 256 }),
                vigente: (vista: VistaCalendario) => fireEvent.mouseDown(zonaCreacion(vista), { clientX: 20, clientY: 120 }),
                moverVigente: { clientX: 20, clientY: 184 },
                comprobar: (p: Props) => {
                    expect(screen.getByText('Nuevo horario')).toBeTruthy();
                    expect(p.onCrear).not.toHaveBeenCalled();
                    expect(p.onMover).not.toHaveBeenCalled();
                    expect(p.onAjustarFecha).not.toHaveBeenCalled();
                },
            },
        ];

        for (const caso of casos) {
            const p = props({ turnosPuntuales: [excepcionPuntual()] });
            const vista = renderWithTheme(<CalendarioHorariosInstructor {...p}/>);
            const listeners = vigilarEscuchadoresRaton();
            caso.anterior(vista);
            const anteriores = listeners.identidades();
            caso.vigente(vista);
            listeners.esperarBajaExacta(anteriores);
            expect(listeners.altas()).toHaveLength(4);

            invocarEscuchadorRaton(anteriores.mover, 'mousemove', 240, 448);
            invocarEscuchadorRaton(anteriores.soltar, 'mouseup', 240, 448);
            listeners.esperarBajaExacta(anteriores);
            fireEvent.mouseMove(window, caso.moverVigente);
            fireEvent.mouseUp(window, caso.moverVigente);
            caso.comprobar(p);
            expect(listeners.bajas()).toHaveLength(4);
            vista.unmount();
            listeners.agregar.mockRestore();
            listeners.quitar.mockRestore();
        }
    });
});
