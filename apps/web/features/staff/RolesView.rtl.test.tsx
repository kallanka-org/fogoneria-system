// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({
  roles: [] as unknown[],
  setRoles: vi.fn(),
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

import { RolesView } from './RolesView';

beforeEach(() => {
  estado.roles = [
    { id: 'mozo', name: 'Mozo', description: 'Atiende mesas' },
    { id: 'anfitrion', name: 'Anfitrión', description: 'Recibe' },
  ];
  estado.setRoles.mockReset();
  estado.notify.mockReset();
});

afterEach(cleanup);

describe('RolesView', () => {
  it('crea un rol nuevo', () => {
    render(<RolesView />);
    fireEvent.click(screen.getByText('+ Nuevo rol'));
    fireEvent.change(screen.getByPlaceholderText(/Anfitri/), { target: { value: 'Anfitrión' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(estado.setRoles).toHaveBeenCalledWith([
      expect.any(Object),
      expect.any(Object),
      expect.objectContaining({ id: 'anfitri-n', name: 'Anfitrión' }),
    ]);
    expect(estado.notify).toHaveBeenCalledWith('Rol creado', expect.any(String));
  });

  it('edita la descripción de un rol', () => {
    render(<RolesView />);
    fireEvent.click(screen.getAllByText('Editar')[0]!);
    fireEvent.change(screen.getByDisplayValue('Atiende mesas'), {
      target: { value: 'Atiende y cobra' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(estado.setRoles).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'mozo', description: 'Atiende y cobra' }),
      expect.any(Object),
    ]);
  });

  it('protege el rol con empleados y elimina el libre', () => {
    render(<RolesView />);
    fireEvent.click(screen.getAllByText('Eliminar')[0]!);
    fireEvent.click(screen.getAllByText('Eliminar').at(-1)!);
    expect(estado.setRoles).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByText('Eliminar')[1]!);
    fireEvent.click(screen.getAllByText('Eliminar').at(-1)!);
    expect(estado.setRoles).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'mozo' }),
    ]);
  });
});
