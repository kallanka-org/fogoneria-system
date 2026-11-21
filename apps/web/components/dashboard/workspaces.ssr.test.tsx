import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({
  currentUser: { role: 'sucursal' as string | undefined },
  tables: [] as unknown[],
  reservations: [] as unknown[],
  products: [] as unknown[],
  categories: [] as unknown[],
  priceLists: [] as unknown[],
  priceOf: vi.fn(() => 24.9),
  categoryNameOf: vi.fn(() => 'Fondos'),
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
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: unknown }) => <div>{children as never}</div>,
  BarChart: ({ children }: { children?: unknown }) => <div>{children as never}</div>,
  Bar: () => null,
  XAxis: () => null,
}));
vi.mock('@/components/dashboard/MenuPreview', () => ({
  MenuPreview: ({ menuItems }: { menuItems: unknown[] }) => <div>menu:{menuItems.length}</div>,
}));
vi.mock('@/components/dashboard/summaries/ModuleSummary', () => ({
  ModuleSummary: ({ chartTitle, children }: { chartTitle: string; children?: unknown }) => (
    <div>
      {chartTitle}:{children as never}
    </div>
  ),
}));
vi.mock('@/components/dashboard/summaries/charts', () => ({ MiniBars: () => null }));

import { BookingsWorkspace } from '@/features/mod_reservations';
import { CartaVirtualView } from '@/features/mod_catalog';
import { StaffWorkspace } from '@/features/mod_staff';

describe('BookingsWorkspace', () => {
  it('calcula ocupación con mesas y muestra el maestro solo a sucursal', () => {
    estado.tables = [{ status: 'ocupada' }, { status: 'libre' }];
    estado.reservations = [{ id: 'r-1' }];
    estado.currentUser = { role: 'sucursal' };
    const html = renderToStaticMarkup(<BookingsWorkspace />);
    expect(html).toContain('50%');
    expect(html).toContain('Maestro de mesas');
    expect(html).toContain('Reservas hoy');
  });

  it('no divide por cero y oculta el maestro al admin', () => {
    estado.tables = [];
    estado.reservations = [];
    estado.currentUser = { role: 'admin' };
    const html = renderToStaticMarkup(<BookingsWorkspace />);
    expect(html).toContain('0%');
    expect(html).not.toContain('Maestro de mesas');
  });
});

describe('StaffWorkspace', () => {
  it('pinta KPIs, gráfico y accesos', () => {
    const html = renderToStaticMarkup(<StaffWorkspace />);
    expect(html).toContain('En turno ahora');
    expect(html).toContain('Asistencia semanal');
    expect(html).toContain('Marcar asistencia');
    expect(html).toContain('Roles');
  });
});

describe('CartaVirtualView', () => {
  it('usa la lista activa y solo platos activos', () => {
    estado.products = [
      { id: 'p-1', name: 'Lomo', description: 'rico', status: 'Activo', categoryId: 'c-1', image: '' },
      { id: 'p-2', name: 'Retirado', description: '', status: 'Inactivo', categoryId: 'c-1', image: '' },
    ];
    estado.categories = [{ id: 'c-1', name: 'Fondos' }];
    estado.priceLists = [
      { id: 'l-1', name: 'Carta', active: true },
      { id: 'l-2', name: 'Delivery', active: false },
    ];
    const html = renderToStaticMarkup(<CartaVirtualView />);
    expect(html).toContain('Carta');
    expect(html).toContain('menu:1');
  });

  it('cae a un guion si no hay lista activa', () => {
    estado.products = [];
    estado.priceLists = [];
    const html = renderToStaticMarkup(<CartaVirtualView />);
    expect(html).toContain('menu:0');
    expect(html).toContain('—');
  });
});
