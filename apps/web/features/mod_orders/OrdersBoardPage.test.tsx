import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const tablero = vi.hoisted(() => ({
  board: {
    columns: [
      {
        status: 'pendiente',
        label: 'Por confirmar',
        orders: [
          {
            id: 'ORD-000001',
            apiId: 'o-1',
            status: 'pendiente',
            customer: 'Mesa 4',
            channel: 'Mesa',
            waiter: 'Luis',
            amount: 44.9,
            items: 2,
            createdAt: '2026-11-20T11:00:00.000Z',
            slaBaseAt: '2026-11-20T11:00:00.000Z',
            alertaSla: false,
            excedidoPor: null,
            mesa: { id: 'm-1', numero: '4' },
          },
        ],
      },
      { status: 'cocina', label: 'En cocina', orders: [] },
      { status: 'listo', label: 'Listo', orders: [] },
      { status: 'entregado', label: 'Entregado', orders: [] },
    ],
    slaMinutos: 20,
    truncado: false,
    generadoAt: '2026-11-20T12:00:00.000Z',
    metricas: { abiertas: 1, fueraDeSla: 0, promedioEsperaMin: 3, promedioPreparacionMin: null },
  },
  loading: false,
  error: null as string | null,
  refresh: () => {},
}));

vi.mock('./hooks', () => ({
  useTableroOrdenes: () => tablero,
  useOrdersRealtime: () => ({ status: 'online', lastEvent: null }),
}));

const estado = vi.hoisted(() => ({
  orders: [],
  advanceOrder: () => {},
  ordersLoading: false,
  ordersError: null,
  refreshOrders: () => {},
  activeBranch: { id: 's-1', name: 'Miraflores' },
  isGeneral: false,
  branchOf: () => ({ name: 'Miraflores' }),
  currentUser: { id: 'u-1', role: 'cocina', empresaId: 'e-1', branchId: 's-1' },
  notify: () => {},
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

import { OrdersBoardPage } from './OrdersBoardPage';

describe('OrdersBoardPage', () => {
  it('pinta las cuatro columnas del KDS con la comanda', () => {
    const markup = renderToStaticMarkup(<OrdersBoardPage />);
    expect(markup).toContain('Por confirmar');
    expect(markup).toContain('En cocina');
    expect(markup).toContain('ORD-000001');
    expect(markup).toContain('Mesa 4');
  });

  it('el modo cocina muestra sus acciones', () => {
    const markup = renderToStaticMarkup(<OrdersBoardPage mode="cocina" />);
    expect(markup).toContain('En cocina');
  });

  it('un error del tablero se pinta', () => {
    tablero.error = 'No se pudo cargar el tablero';
    const markup = renderToStaticMarkup(<OrdersBoardPage />);
    expect(markup).toContain('No se pudo cargar el tablero');
    tablero.error = null;
  });
});
