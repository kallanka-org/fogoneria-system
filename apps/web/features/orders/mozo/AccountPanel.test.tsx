import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({
  currentUser: { id: 'u-1', name: 'Luis', role: 'mesero' },
  updateAccountItem: () => {},
  removeAccountItem: () => {},
  addAccountItems: () => {},
  sendToKitchen: () => {},
  annulAccount: () => {},
  checkoutAccount: () => {},
  notify: () => {},
  tables: [],
  products: [],
  priceOf: () => 24.9,
  catalogoLoading: false,
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

import { AccountPanel } from './AccountPanel';
import type { TableAccount } from '@/lib/domain';

const cuenta: TableAccount = {
  id: 'acc-1',
  branchId: 'b-1',
  tableId: 1,
  label: 'Mesa 1',
  customer: 'Ana',
  waiter: 'Luis',
  openedAt: '2026-11-20T12:00:00.000Z',
  closedAt: null,
  status: 'abierta',
  items: [
    {
      id: 'it-1',
      productId: 'p-1',
      name: 'Lomo saltado',
      qty: 2,
      unitPrice: 24.9,
      modifiers: [{ optionId: 'o-1', name: 'Extra queso', extra: 2 }],
      notes: 'Sin ají',
      sent: false,
    },
  ],
  payments: [],
  tip: 0,
  discount: 0,
  discountConcept: '',
  couponCode: null,
  customerId: null,
  motivoAnulacion: null,
};

describe('AccountPanel', () => {
  it('pinta la cuenta con sus líneas y totales', () => {
    const markup = renderToStaticMarkup(<AccountPanel account={cuenta} onBack={() => {}} />);
    expect(markup).toContain('Mesa 1');
    expect(markup).toContain('Lomo saltado');
    expect(markup).toContain('Sin ají');
    expect(markup).toContain('53.80');
  });

  it('una cuenta vacía invita a agregar platos', () => {
    const markup = renderToStaticMarkup(
      <AccountPanel account={{ ...cuenta, items: [] }} onBack={() => {}} />,
    );
    expect(markup.length).toBeGreaterThan(0);
    expect(markup).toContain('Mesa 1');
  });

  it('con líneas enviadas, pagos, propina y descuento pinta los totales completos', () => {
    const markup = renderToStaticMarkup(
      <AccountPanel
        account={{
          ...cuenta,
          items: [{ ...cuenta.items[0], sent: true }],
          payments: [{ method: 'Efectivo', amount: 40, tip: 5, at: '2026-11-20T13:00:00.000Z' }],
          tip: 5,
          discount: 4.4,
          discountConcept: 'Cupón PARRILLA10',
          couponCode: 'PARRILLA10',
          customer: 'Ana Torres',
        }}
        onBack={() => {}}
      />,
    );
    expect(markup).toContain('Ana Torres');
    expect(markup).toContain('Mesa 1');
  });

  it('una cuenta cobrada muestra su estado sin acciones de cobro', () => {
    const markup = renderToStaticMarkup(
      <AccountPanel
        account={{ ...cuenta, status: 'cobrada', closedAt: '2026-11-20T14:00:00.000Z' }}
        onBack={() => {}}
      />,
    );
    expect(markup).toContain('Mesa 1');
  });
});
