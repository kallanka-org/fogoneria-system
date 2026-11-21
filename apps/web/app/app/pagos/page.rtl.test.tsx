// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({
  payments: [] as unknown[],
  notify: vi.fn(),
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
vi.mock('@/components/dashboard/PaymentsView', () => ({
  PaymentsView: ({ paymentHistory }: { paymentHistory: unknown[] }) => (
    <div>pagos:{paymentHistory.length}</div>
  ),
}));
vi.mock('@/components/dashboard/PlanModals', () => ({
  PlanModal: ({
    selectedPlan,
    setSelectedPlan,
    onContinue,
    onClose,
  }: {
    selectedPlan: string;
    setSelectedPlan: (plan: string) => void;
    onContinue: () => void;
    onClose: () => void;
  }) => (
    <div>
      <span>plan:{selectedPlan}</span>
      <button type="button" onClick={() => setSelectedPlan('basico')}>
        Elegir básico
      </button>
      <button type="button" onClick={onContinue}>
        Continuar plan
      </button>
      <button type="button" onClick={onClose}>
        Cerrar plan
      </button>
    </div>
  ),
  SecurityModal: ({
    onConfirmPlanChange,
    onClose,
  }: {
    onConfirmPlanChange: () => void;
    onClose: () => void;
  }) => (
    <div>
      <button type="button" onClick={onConfirmPlanChange}>
        Confirmar plan
      </button>
      <button type="button" onClick={onClose}>
        Cerrar seguridad
      </button>
    </div>
  ),
}));

import PagosPage from './page';

beforeEach(() => {
  estado.notify.mockReset();
});

afterEach(cleanup);

describe('PagosPage', () => {
  it('abre el plan, cambia a básico y confirma la suscripción', () => {
    render(<PagosPage />);
    expect(screen.getByText(/Plan Profesional/)).toBeTruthy();
    expect(screen.getByText('pagos:1')).toBeTruthy();

    fireEvent.click(screen.getByText('Gestionar suscripción'));
    expect(screen.getByText('plan:profesional')).toBeTruthy();
    fireEvent.click(screen.getByText('Elegir básico'));
    fireEvent.click(screen.getByText('Continuar plan'));
    fireEvent.click(screen.getByText('Confirmar plan'));

    expect(estado.notify).toHaveBeenCalledWith(
      'Plan actualizado con éxito',
      'Has cambiado al Plan Básico.',
    );
    expect(screen.getByText(/Plan Básico/)).toBeTruthy();
    expect(screen.queryByText('Confirmar plan')).toBeNull();
  });

  it('cierra el modal de plan sin abrir seguridad', () => {
    render(<PagosPage />);
    fireEvent.click(screen.getByText('Gestionar suscripción'));
    fireEvent.click(screen.getByText('Cerrar plan'));
    expect(screen.queryByText('Confirmar plan')).toBeNull();
    expect(screen.getByText(/Plan Profesional/)).toBeTruthy();
  });

  it('cierra la verificación de seguridad sin cambiar el plan', () => {
    render(<PagosPage />);
    fireEvent.click(screen.getByText('Gestionar suscripción'));
    fireEvent.click(screen.getByText('Continuar plan'));
    fireEvent.click(screen.getByText('Cerrar seguridad'));
    expect(estado.notify).not.toHaveBeenCalled();
    expect(screen.getByText(/Plan Profesional/)).toBeTruthy();
  });
});
