import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({
  hasSession: false,
  customers: [] as unknown[],
  setCustomers: () => {},
  notify: () => {},
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

import { ClientesPage } from './ClientesPage';

describe('ClientesPage', () => {
  it('pinta el maestro demo de clientes', () => {
    const markup = renderToStaticMarkup(<ClientesPage />);
    expect(markup).toContain('Nuevo cliente');
    expect(markup).toContain('Buscar');
    expect(markup).toContain('Segmento');
  });

  it('con clientes pinta la tabla y sus segmentos', () => {
    estado.customers = [
      { id: 1, name: 'Rosa Pérez', phone: '+51 987 654 321', email: '', segment: 'VIP', visits: 21, points: 1240, lastVisit: 'Hoy', birthday: '', notes: '' },
      { id: 2, name: 'Jorge Paredes', phone: '+51 955 128 774', email: '', segment: 'Nuevo', visits: 1, points: 10, lastVisit: 'Ayer', birthday: '', notes: '' },
    ];
    const markup = renderToStaticMarkup(<ClientesPage />);
    expect(markup).toContain('Rosa Pérez');
    expect(markup).toContain('Jorge Paredes');
    estado.customers = [];
  });

  it('con sesión arranca en modo API y deja el buscador disponible', () => {
    estado.hasSession = true;
    const markup = renderToStaticMarkup(<ClientesPage />);
    expect(markup).toContain('Buscar');
    estado.hasSession = false;
  });
});
