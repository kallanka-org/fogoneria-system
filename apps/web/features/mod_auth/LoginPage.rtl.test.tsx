// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const sesion = vi.hoisted(() => ({ login: vi.fn() }));
vi.mock('@/components/dashboard/providers/session', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useSession: () => sesion,
}));
vi.mock('@/components/dashboard/providers/notifications', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useNotifications: () => sesion,
}));
vi.mock('@/features/mod_tenant/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTenant: () => sesion,
}));
vi.mock('@/components/dashboard/providers/catalog', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useCatalogoState: () => sesion,
}));
vi.mock('@/components/dashboard/providers/live', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useLiveData: () => sesion,
}));
vi.mock('@/components/dashboard/providers/workspace-actions', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useWorkspaceActions: () => sesion,
}));
vi.mock('@/components/dashboard/hooks/use-cash-scope', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useCashScope: () => sesion,
}));
vi.mock('@/components/dashboard/hooks/use-branch-scope', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useBranchScope: () => sesion,
}));
vi.mock('@/components/dashboard/hooks/use-accounts-scope', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAccountsScope: () => (sesion as unknown as { accounts?: unknown[] }).accounts as never,
}));
vi.mock('@/features/mod_orders/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAccounts: () => sesion,
  useOrdersDemo: () => sesion,
}));
vi.mock('@/features/mod_tables/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTables: () => sesion,
}));
vi.mock('@/features/mod_reservations/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useReservations: () => sesion,
}));
vi.mock('@/features/mod_cash/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useCash: () => sesion,
}));
vi.mock('@/features/mod_receipts/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useReceipts: () => sesion,
}));
vi.mock('@/features/mod_promotions/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  usePromotions: () => sesion,
}));
vi.mock('@/features/mod_crm/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useCrm: () => sesion,
}));
vi.mock('@/features/mod_expenses/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useExpenses: () => sesion,
}));
vi.mock('@/features/mod_inventory/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useInventory: () => sesion,
}));
vi.mock('@/features/mod_staff/provider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useStaff: () => sesion,
}));
vi.mock('@/components/dashboard/providers/tickets', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTickets: () => sesion,
}));

import { LoginPage } from './LoginPage';

beforeEach(() => {
  sesion.login.mockReset();
  router.push.mockReset();
});

afterEach(cleanup);

describe('LoginPage', () => {
  it('exige correo y contraseña', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByText('Ingresa tu correo y contraseña.')).toBeTruthy();
    expect(sesion.login).not.toHaveBeenCalled();
  });

  it('entra y redirige al home del rol', async () => {
    sesion.login.mockResolvedValue({ role: 'cajero' });
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('tucorreo@ejemplo.com'), {
      target: { value: 'caja@mirestaurante.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Fogoneria123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() =>
      expect(sesion.login).toHaveBeenCalledWith('caja@mirestaurante.com', 'Fogoneria123!'),
    );
    expect(router.push).toHaveBeenCalledWith('/app/caja');
  });

  it('muestra el error del login', async () => {
    sesion.login.mockRejectedValue(new Error('Credenciales inválidas'));
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('tucorreo@ejemplo.com'), {
      target: { value: 'x@y.pe' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'mala' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(screen.getByText('Credenciales inválidas')).toBeTruthy());
    expect(router.push).not.toHaveBeenCalled();
  });

  it('enlaza la recuperación y no muestra términos', () => {
    render(<LoginPage />);
    expect(screen.getByText('¿Olvidaste tu contraseña?').closest('a')?.getAttribute('href')).toBe(
      '/recuperar',
    );
    expect(screen.queryByText('Términos y Condiciones')).toBeNull();
    expect(document.querySelector('a[href="/terminos"]')).toBeNull();
  });
});
