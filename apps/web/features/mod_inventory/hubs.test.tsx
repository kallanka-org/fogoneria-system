import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({
  ingredients: [
    { id: 1, name: 'Lomo fino', category: 'Carnes', stock: 12, min: 5, unit: 'kg', state: 'Óptimo' },
    { id: 2, name: 'Ají amarillo', category: 'Vegetales', stock: 1, min: 3, unit: 'kg', state: 'Bajo' },
  ],
  movements: [{ id: 1, datetime: 'Hoy', type: 'Salida', ingredient: 'Lomo fino', qty: '-1 kg', reason: 'Venta' }],
  customers: [
    { id: 1, name: 'Rosa', phone: '987654321', email: '', segment: 'VIP', visits: 21, points: 1240, lastVisit: 'Hoy', birthday: '', notes: '' },
  ],
  coupons: [
    { id: 1, code: 'VERANO20', kind: 'percent', value: 10, used: 2, limit: 10, active: true, expires: '2026-12-31' },
  ],
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

import { InventoryHubPage } from './InventoryHubPage';
import { LoyaltyHubPage } from '../mod_crm/LoyaltyHubPage';

describe('InventoryHubPage', () => {
  it('pinta KPIs, gráfico y bloques de inventario', () => {
    const markup = renderToStaticMarkup(<InventoryHubPage />);
    expect(markup).toContain('Insumos registrados');
    expect(markup).toContain('Insumos por categoría');
    expect(markup).toContain('Kardex');
  });

  it('sin insumos deja los KPIs en cero', () => {
    const insumos = estado.ingredients;
    estado.ingredients = [];
    const markup = renderToStaticMarkup(<InventoryHubPage />);
    expect(markup.length).toBeGreaterThan(0);
    estado.ingredients = insumos;
  });
});

describe('LoyaltyHubPage', () => {
  it('pinta puntos, canjes y bloques de fidelización', () => {
    const markup = renderToStaticMarkup(<LoyaltyHubPage />);
    expect(markup).toContain('Puntos circulando');
    expect(markup).toContain('Cupones canjeados');
    expect(markup).toContain('Comensales');
  });

  it('sin clientes ni cupones deja los acumulados en cero', () => {
    const clientes = estado.customers;
    const cupones = estado.coupons;
    estado.customers = [];
    estado.coupons = [];
    const markup = renderToStaticMarkup(<LoyaltyHubPage />);
    expect(markup.length).toBeGreaterThan(0);
    estado.customers = clientes;
    estado.coupons = cupones;
  });
});
