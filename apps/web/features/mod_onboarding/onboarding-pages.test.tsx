// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const estado = vi.hoisted(() => ({ login: vi.fn(), notify: vi.fn() }));
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

const api = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock('./api', () => ({ onboardingApi: api }));

import { OnboardingPage } from './OnboardingPage';

function llenarPasoUno() {
  fireEvent.change(screen.getByPlaceholderText('Ej. Parrilla El Fuego S.A.C.'), {
    target: { value: 'El Fuego SAC' },
  });
  fireEvent.change(screen.getByPlaceholderText('20123456786'), {
    target: { value: '20123456786' },
  });
}

function llenarPasoAdmin() {
  fireEvent.change(screen.getByPlaceholderText(/Mar.a Torres/), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByPlaceholderText('admin@turestaurante.pe'), {
    target: { value: 'ana@fuego.pe' },
  });
  fireEvent.change(screen.getByPlaceholderText(/nimo 8 caracteres/), {
    target: { value: 'secreta123' },
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('OnboardingPage', () => {
  it('arranca en el primer paso del wizard', () => {
    const markup = renderToStaticMarkup(<OnboardingPage />);
    expect(markup).toContain('Conozcamos tu restaurante');
    expect(markup).toContain('Razón social');
    expect(markup).toContain('Identidad y Local');
  });

  it('valida el paso 1 y navega adelante y atrás', () => {
    render(<OnboardingPage />);

    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByRole('alert').textContent).toMatch(/Ingresa la raz/);

    llenarPasoUno();
    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getByText('La Carta')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Atr/ }));
    expect(screen.getByText('Identidad y Local')).toBeTruthy();
  });

  it('crea la cuenta y entra con el rol nuevo', async () => {
    estado.login.mockResolvedValue({ role: 'admin' });
    api.submit.mockResolvedValue({ empresaId: 'e-1' });
    render(<OnboardingPage />);
    llenarPasoUno();
    fireEvent.click(screen.getByText('Siguiente'));
    fireEvent.click(screen.getByText('Siguiente'));
    llenarPasoAdmin();
    fireEvent.click(screen.getByText('Finalizar y Enviar'));

    await waitFor(() => expect(api.submit).toHaveBeenCalled());
    await waitFor(() =>
      expect(estado.login).toHaveBeenCalledWith('ana@fuego.pe', 'secreta123'),
    );
    expect(router.push).toHaveBeenCalled();
  });

  it('muestra el error de la API al finalizar', async () => {
    api.submit.mockRejectedValue(new Error('RUC ya registrado'));
    render(<OnboardingPage />);
    llenarPasoUno();
    fireEvent.click(screen.getByText('Siguiente'));
    fireEvent.click(screen.getByText('Siguiente'));
    llenarPasoAdmin();
    fireEvent.click(screen.getByText('Finalizar y Enviar'));

    await waitFor(() => expect(api.submit).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('RUC ya registrado'));
    expect(estado.login).not.toHaveBeenCalled();
  });
});
