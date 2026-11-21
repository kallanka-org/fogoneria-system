import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const hoy = new Date().toISOString();

const estado = vi.hoisted(() => ({
  hasSession: false,
  receipts: [] as unknown[],
  setReceipts: () => {},
  annulReceipt: () => {},
  enviarSunat: () => {},
  generarResumenDiario: () => {},
  sunatContingencia: false,
  toggleSunatContingencia: () => {},
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

import { ComprobantesPage } from './ComprobantesPage';

describe('ComprobantesPage', () => {
  it('pinta el panel demo de comprobantes con sus KPIs', () => {
    const markup = renderToStaticMarkup(<ComprobantesPage />);
    expect(markup).toContain('Emitir comprobante');
    expect(markup).toContain('Pagadas vs anuladas');
    expect(markup).toContain('series B001/F001/NC01');
  });

  it('sin comprobantes el panel queda en cero', () => {
    const markup = renderToStaticMarkup(<ComprobantesPage />);
    expect(markup).toContain('>0<');
    expect(markup).toContain('sin anulaciones');
  });

  it('con comprobantes pagados y anulados resume los importes', () => {
    estado.receipts = [      {
        id: 'B001-1',
        type: '03',
        at: hoy,
        date: 'Hoy',
        customer: 'Ana',
        docType: '',
        docNumber: '',
        subtotal: 50,
        igv: 9,
        total: 59,
        status: 'Pagada',
        source: 'Mesa 4',
        estadoSunat: 'aceptado',
        intentosEnvio: 1,
      },
      {
        id: 'B001-2',
        type: '03',
        at: hoy,
        date: 'Hoy',
        customer: 'Luis',
        docType: '',
        docNumber: '',
        subtotal: 10,
        igv: 1.8,
        total: 11.8,
        status: 'Anulada',
        source: 'Mesa 2',
        estadoSunat: 'anulado',
        intentosEnvio: 0,
        motivoAnulacion: 'Duplicado',
      },
    ];
    const markup = renderToStaticMarkup(<ComprobantesPage />);
    expect(markup).toContain('requieren revisión');
    expect(markup).toContain('$59.00');
    estado.receipts = [];
  });

  it('con sesión arranca en modo API sin filas locales', () => {
    estado.hasSession = true;
    const markup = renderToStaticMarkup(<ComprobantesPage />);
    expect(markup).toContain('Emitir comprobante');
    estado.hasSession = false;
  });
});
