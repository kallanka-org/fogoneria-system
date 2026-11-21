// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  pnl: vi.fn(),
  serie: vi.fn(),
  platosTop: vi.fn(),
  cobrosPorMetodo: vi.fn(),
  rangoVista: vi.fn(() => ({ desde: '2026-11-14', hasta: '2026-11-20' })),
}));

const sesion = vi.hoisted(() => ({ hasSession: true }));

vi.mock('./api', () => ({
  biApi: {
    pnl: api.pnl,
    serie: api.serie,
    platosTop: api.platosTop,
    cobrosPorMetodo: api.cobrosPorMetodo,
  },
  rangoVista: api.rangoVista,
}));
vi.mock('@/components/dashboard/providers/session', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useSession: () => sesion,
}));
vi.mock('@/components/dashboard/providers/notifications', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useNotifications: () => sesion,
}));
vi.mock('@/features/tenant/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTenant: () => sesion,
}));
vi.mock('@/components/dashboard/providers/catalog', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useCatalogoState: () => sesion,
}));
vi.mock('@/components/dashboard/providers/live', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useLiveData: () => sesion,
}));
vi.mock('@/components/dashboard/providers/workspace-actions', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useWorkspaceActions: () => sesion,
}));
vi.mock('@/components/dashboard/hooks/use-cash-scope', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useCashScope: () => sesion,
}));
vi.mock('@/components/dashboard/hooks/use-branch-scope', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useBranchScope: () => sesion,
}));
vi.mock('@/components/dashboard/hooks/use-accounts-scope', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAccountsScope: () => (sesion as unknown as { accounts?: unknown[] }).accounts as never,
}));
vi.mock('@/features/orders/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAccounts: () => sesion,
  useOrdersDemo: () => sesion,
}));
vi.mock('@/features/tables/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTables: () => sesion,
}));
vi.mock('@/features/reservations/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useReservations: () => sesion,
}));
vi.mock('@/features/cash/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useCash: () => sesion,
}));
vi.mock('@/features/receipts/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useReceipts: () => sesion,
}));
vi.mock('@/features/promotions/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  usePromotions: () => sesion,
}));
vi.mock('@/features/crm/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useCrm: () => sesion,
}));
vi.mock('@/features/expenses/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useExpenses: () => sesion,
}));
vi.mock('@/features/inventory/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useInventory: () => sesion,
}));
vi.mock('@/features/staff/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useStaff: () => sesion,
}));
vi.mock('@/components/dashboard/providers/tickets', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTickets: () => sesion,
}));

import { useBi } from './hooks';

const pnl = {
  desde: '2026-11-14',
  hasta: '2026-11-20',
  sucursalId: null,
  ventas: 288,
  comprobado: 200,
  ventaSinComprobante: 88,
  gastos: 100,
  margen: 188,
  propinas: 40,
};

describe('useBi', () => {
  beforeEach(() => {
    sesion.hasSession = true;
    api.pnl.mockReset();
    api.serie.mockReset();
    api.platosTop.mockReset();
    api.cobrosPorMetodo.mockReset();
    api.pnl.mockResolvedValue(pnl);
    api.serie.mockResolvedValue([{ fecha: '2026-11-20', ventas: 288, gastos: 100, margen: 188 }]);
    api.platosTop.mockResolvedValue([{ platoId: 'p-1', nombre: 'Lomo', unidades: 5, ingresos: 120 }]);
    api.cobrosPorMetodo.mockResolvedValue([{ metodo: 'EFECTIVO', cobros: 4, monto: 198 }]);
  });

  it('sin sesión no llama a la API', async () => {
    sesion.hasSession = false;
    const { result } = renderHook(() => useBi());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(result.current.pnl).toBeNull();
    expect(api.pnl).not.toHaveBeenCalled();
  });

  it('carga P&L, serie, platos y métodos', async () => {
    const { result } = renderHook(() => useBi(7));
    await waitFor(() => expect(result.current.pnl).toEqual(pnl));
    expect(result.current.serie).toHaveLength(1);
    expect(result.current.platos).toHaveLength(1);
    expect(result.current.metodos).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(api.rangoVista).toHaveBeenCalledWith(7);
  });

  it('expone el error de la carga sin romper', async () => {
    api.pnl.mockRejectedValue(new Error('API caída'));
    const { result } = renderHook(() => useBi());
    await waitFor(() => expect(result.current.error).toBe('API caída'));
    expect(result.current.pnl).toBeNull();
  });

  it('un error no-Error usa el mensaje por defecto', async () => {
    api.pnl.mockRejectedValue('boom');
    const { result } = renderHook(() => useBi());
    await waitFor(() =>
      expect(result.current.error).toBe('No se pudieron cargar las analíticas.'),
    );
  });
});
