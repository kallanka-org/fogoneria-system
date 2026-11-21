import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({
  cashMovements: [
    { id: 1, at: '2026-11-20T12:00:00.000Z', concept: 'Cobro ORD-1', kind: 'Ingreso', method: 'Efectivo', amount: 59, shiftId: 'shift-1' },
    { id: 2, at: '2026-11-20T13:00:00.000Z', concept: 'Compra hielo', kind: 'Egreso', method: 'Efectivo', amount: 20, shiftId: 'shift-1' },
  ],
  setCashMovements: () => {},
  openCashShift: null,
  cashShifts: [
    {
      id: 'shift-1',
      branchId: 'b-1',
      status: 'cerrado',
      openedBy: 'Cajera',
      openedAt: '2026-11-20T08:00:00.000Z',
      openingFund: 200,
      closedBy: 'Cajera',
      closedAt: '2026-11-20T20:00:00.000Z',
      countedCash: 240,
      expectedCash: 239,
      difference: 1,
      observations: 'Cuadra',
    },
  ],
  startCashShift: () => {},
  closeCashShift: () => {},
  accounts: [],
  refreshOrders: () => {},
  notify: () => {},
  isGeneral: false,
  branchOf: () => ({ name: 'Miraflores' }),
  currentUser: { id: 'u-1', name: 'Cajera', role: 'cajero', empresaId: null, branchId: 's-1' },
}));

vi.mock('@/components/dashboard/providers/session', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useSession: () => estado,
}));
vi.mock('@/components/dashboard/providers/notifications', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useNotifications: () => estado,
}));
vi.mock('@/features/mod_tenant/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTenant: () => estado,
}));
vi.mock('@/components/dashboard/providers/catalog', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useCatalogoState: () => estado,
}));
vi.mock('@/components/dashboard/providers/live', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useLiveData: () => estado,
}));
vi.mock('@/components/dashboard/providers/workspace-actions', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useWorkspaceActions: () => estado,
}));
vi.mock('@/components/dashboard/hooks/use-cash-scope', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useCashScope: () => estado,
}));
vi.mock('@/components/dashboard/hooks/use-branch-scope', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useBranchScope: () => estado,
}));
vi.mock('@/components/dashboard/hooks/use-accounts-scope', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAccountsScope: () => (estado as unknown as { accounts?: unknown[] }).accounts as never,
}));
vi.mock('@/features/mod_orders/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAccounts: () => estado,
  useOrdersDemo: () => estado,
}));
vi.mock('@/features/mod_tables/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTables: () => estado,
}));
vi.mock('@/features/mod_reservations/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useReservations: () => estado,
}));
vi.mock('@/features/mod_cash/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useCash: () => estado,
}));
vi.mock('@/features/mod_receipts/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useReceipts: () => estado,
}));
vi.mock('@/features/mod_promotions/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  usePromotions: () => estado,
}));
vi.mock('@/features/mod_crm/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useCrm: () => estado,
}));
vi.mock('@/features/mod_expenses/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useExpenses: () => estado,
}));
vi.mock('@/features/mod_inventory/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useInventory: () => estado,
}));
vi.mock('@/features/mod_staff/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useStaff: () => estado,
}));
vi.mock('@/components/dashboard/providers/tickets', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTickets: () => estado,
}));

import { CajaPage } from './CajaPage';

describe('CajaPage', () => {
  it('sin turno abierto invita a abrir caja', () => {
    const markup = renderToStaticMarkup(<CajaPage />);
    expect(markup).toContain('Caja cerrada');
    expect(markup).toContain('Abrir turno');
  });

  it('pinta el resumen del turno y la tabla de movimientos', () => {
    const markup = renderToStaticMarkup(<CajaPage />);
    expect(markup).toContain('Resumen de caja');
    expect(markup).toContain('Movimientos del turno');
    expect(markup).toContain('Cobro ORD-1');
    expect(markup).toContain('Compra hielo');
    expect(markup).toContain('Sin cuentas abiertas por cobrar.');
  });

  it('el historial muestra el turno cerrado y su descuadre', () => {
    const markup = renderToStaticMarkup(<CajaPage />);
    expect(markup).toContain('Historial de turnos');
    expect(markup).toContain('Cajera');
    expect(markup).toContain('+$1.00');
  });

  it('con turno abierto muestra el fondo, el esperado y las cuentas por cobrar', () => {
    estado.openCashShift = {
      id: 'shift-1',
      openingFund: 200,
      openedBy: 'Cajera',
      openedAt: '2026-11-20T08:00:00.000Z',
    } as never;
    estado.accounts = [
      {
        id: 'acc-1',
        branchId: 'b-1',
        tableId: 1,
        label: 'Mesa 1',
        customer: 'Ana',
        waiter: 'Luis',
        openedAt: '2026-11-20T12:00:00.000Z',
        closedAt: null,
        status: 'abierta',
        items: [],
        payments: [],
        tip: 0,
        discount: 0,
        discountConcept: '',
        couponCode: null,
        customerId: null,
        motivoAnulacion: null,
      },
    ] as never;
    const markup = renderToStaticMarkup(<CajaPage />);
    expect(markup).toContain('Turno abierto');
    expect(markup).toContain('Cerrar turno (arqueo)');
    expect(markup).toContain('Mesa 1');
    estado.openCashShift = null;
    estado.accounts = [];
  });

  it('con sesión usa el camino de la API en el primer render', () => {
    const usuario = estado.currentUser;
    estado.currentUser = { ...usuario, empresaId: 'e-1' } as never;
    const markup = renderToStaticMarkup(<CajaPage />);
    expect(markup).toContain('Resumen de caja');
    expect(markup).toContain('Movimientos del turno');
    estado.currentUser = usuario;
  });
});
