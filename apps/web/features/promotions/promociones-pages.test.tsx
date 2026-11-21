import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({
  combos: [
    { id: 1, name: 'Dúo Criollo', description: 'Ceviche + chicha', productIds: ['p-1'], price: 17, status: 'Activo' },
  ],
  setCombos: () => {},
  products: [{ id: 'p-1', name: 'Ceviche', sku: 'CEV', categoryId: 'c-1', price: 12 }],
  notify: () => {},
  coupons: [
    { id: 1, code: 'VERANO20', kind: 'percent', value: 10, used: 2, limit: 10, active: true, expires: '2026-12-31' },
  ],
  setCoupons: () => {},
  tables: [],
  reservations: [],
  accounts: [],
  currentUser: { id: 'u-1', role: 'admin' },
  hasSession: false,
  refreshTables: () => {},
  refreshReservations: () => {},
  tablesLoading: false,
  tablesError: null,
  reservationsLoading: false,
  reservationsError: null,
  openAccount: () => {},
  isGeneral: false,
  branches: [],
  branchOf: () => null,
  activeBranchId: 's-1',
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

import { CombosPage } from './CombosPage';
import { PromocionesPage } from './PromocionesPage';

describe('CombosPage', () => {
  it('pinta los combos con su resumen', () => {
    const markup = renderToStaticMarkup(<CombosPage />);
    expect(markup).toContain('Dúo Criollo');
    expect(markup).toContain('Resumen de combos');
  });
});

describe('PromocionesPage', () => {
  it('pinta los cupones con su uso', () => {
    const markup = renderToStaticMarkup(<PromocionesPage />);
    expect(markup).toContain('VERANO20');
    expect(markup).toContain('Cupones');
  });
});
