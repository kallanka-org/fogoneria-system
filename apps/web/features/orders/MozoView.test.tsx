import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({
  currentUser: { id: 'u-1', name: 'Luis Mesero', role: 'mesero', empresaId: 'e-1', branchId: 's-1' },
  accounts: [
    {
      id: 'acc-1',
      branchId: 'b-1',
      tableId: 1,
      label: 'Mesa 1',
      customer: 'Ana',
      waiter: 'Luis Mesero',
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
  ],
  openAccount: () => {},
  orders: [
    {
      id: 'ORD-000001',
      apiId: 'o-1',
      status: 'entregado',
      customer: 'Mesa 1',
      channel: 'Mesa',
      waiter: 'Luis Mesero',
      amount: 44.9,
      items: 2,
      createdAt: '2026-11-20T12:00:00.000Z',
    },
  ],
  ordersLoading: false,
  ordersError: null,
  refreshOrders: () => {},
  advanceOrder: () => {},
  tables: [{ id: 1, label: 'Mesa 1', seats: 4, shape: 'round', status: 'libre', zone: 'Salón' }],
  products: [],
  priceOf: () => 24.9,
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
vi.mock('@/features/tenant/provider', async (importOriginal) => ({
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
vi.mock('@/features/orders/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAccounts: () => estado,
  useOrdersDemo: () => estado,
}));
vi.mock('@/features/tables/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTables: () => estado,
}));
vi.mock('@/features/reservations/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useReservations: () => estado,
}));
vi.mock('@/features/cash/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useCash: () => estado,
}));
vi.mock('@/features/receipts/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useReceipts: () => estado,
}));
vi.mock('@/features/promotions/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  usePromotions: () => estado,
}));
vi.mock('@/features/crm/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useCrm: () => estado,
}));
vi.mock('@/features/expenses/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useExpenses: () => estado,
}));
vi.mock('@/features/inventory/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useInventory: () => estado,
}));
vi.mock('@/features/staff/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useStaff: () => estado,
}));
vi.mock('@/components/dashboard/providers/tickets', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTickets: () => estado,
}));

import { MozoView } from './MozoView';

describe('MozoView', () => {
  it('pinta las cuentas abiertas del mesero', () => {
    const markup = renderToStaticMarkup(<MozoView />);
    expect(markup).toContain('Mesa 1');
    expect(markup).toContain('Nueva cuenta');
  });

  it('muestra el canal en vivo y la pestaña de comandas', () => {
    const markup = renderToStaticMarkup(<MozoView />);
    expect(markup).toContain('Mis comandas');
    expect(markup).toContain('Sin canal en vivo');
  });
});
