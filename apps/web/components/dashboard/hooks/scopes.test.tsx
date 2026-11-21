// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const tenant = vi.hoisted(() => ({
  company: { legalName: 'Demo', ruc: '20123456786' },
  tenant: null,
  branches: [
    { id: 'miraflores', name: 'Miraflores', short: 'Miraflores', isMain: true, status: 'Abierta' },
    { id: 'surco', name: 'Surco', short: 'Surco', isMain: false, status: 'Abierta' },
  ],
  activeBranch: { id: 'miraflores', name: 'Miraflores', short: 'Miraflores', isMain: true, status: 'Abierta' },
  activeBranchId: 'miraflores',
  branchIds: ['miraflores', 'surco'],
  isGeneral: false,
  setActiveBranch: vi.fn(),
}));

const accounts = [
  { id: 'a-1', branchId: 'miraflores' },
  { id: 'a-2', branchId: 'surco' },
];

let cashMap: Record<string, Array<{ id: number }>> = {
  miraflores: [{ id: 1 }],
  surco: [{ id: 2 }],
};
const cash = vi.hoisted(() => ({
  cashShifts: [
    { id: 'CH-1', branchId: 'miraflores', status: 'abierto' },
    { id: 'CH-2', branchId: 'surco', status: 'abierto' },
  ],
  movementsByBranch: {} as Record<string, Array<{ id: number }>>,
  activeShift: vi.fn((branchId: string) => (branchId === 'miraflores' ? { id: 'CH-1' } : null)),
  setMovements: vi.fn(),
  setMovementsByBranch: vi.fn(),
}));

const ordersDemo = vi.hoisted(() => ({
  ordersByBranch: {
    miraflores: [{ id: 'O-1' }],
    surco: [{ id: 'O-2' }],
  },
}));
const tables = vi.hoisted(() => ({
  tablesByBranch: {
    miraflores: [{ id: 11 }],
    surco: [{ id: 22 }],
  },
}));

vi.mock('@/features/mod_tenant/provider', () => ({ useTenant: () => tenant }));
vi.mock('@/features/mod_orders/provider', () => ({
  useAccounts: () => ({ accounts }),
  useOrdersDemo: () => ordersDemo,
}));
vi.mock('@/features/mod_tables/provider', () => ({ useTables: () => tables }));
vi.mock('@/features/mod_cash/provider', () => ({ useCash: () => cash }));
vi.mock('@/features/mod_crm/provider', () => ({
  useCrm: () => ({ customers: [{ id: 7 }], setCustomers: vi.fn() }),
}));
vi.mock('@/features/mod_promotions/provider', () => ({
  usePromotions: () => ({ coupons: [{ code: 'C10' }], setCoupons: vi.fn() }),
}));
vi.mock('@/features/mod_expenses/provider', () => ({
  useExpenses: () => ({ expenses: [{ id: 3 }], setExpenses: vi.fn() }),
}));

import { useAccountsScope } from './use-accounts-scope';
import { useActiveBranchId } from './use-active-branch';
import { useBranchScope } from './use-branch-scope';
import { useCashScope } from './use-cash-scope';
import { useExpenses as useDemoExpenses } from './use-demo-expenses';
import { useLoyaltyData } from './use-loyalty-data';

beforeEach(() => {
  tenant.isGeneral = false;
  tenant.activeBranchId = 'miraflores';
  cashMap = { miraflores: [{ id: 1 }], surco: [{ id: 2 }] };
  cash.movementsByBranch = cashMap;
  cash.setMovements.mockReset();
  cash.setMovements.mockImplementation((branchId: string, updater: (current: Array<{ id: number }>) => Array<{ id: number }>) => {
    cashMap = { ...cashMap, [branchId]: updater(cashMap[branchId] ?? []) };
    cash.movementsByBranch = cashMap;
  });
  cash.setMovementsByBranch.mockReset();
  cash.setMovementsByBranch.mockImplementation(
    (updater: (prev: typeof cashMap) => typeof cashMap) => {
      cashMap = updater(cashMap);
      cash.movementsByBranch = cashMap;
    },
  );
});
afterEach(cleanup);

function Probe() {
  const scopeAccounts = useAccountsScope();
  const branch = useBranchScope();
  const cashScope = useCashScope();
  const activeBranchId = useActiveBranchId();
  const loyalty = useLoyaltyData();
  const expenses = useDemoExpenses();
  return (
    <div>
      <span data-testid="accounts">{scopeAccounts.length}</span>
      <span data-testid="active-branch">{activeBranchId}</span>
      <span data-testid="customers">{loyalty.customers.length}</span>
      <span data-testid="coupons">{loyalty.coupons.length}</span>
      <span data-testid="expenses">{expenses.expenses.length}</span>
      <span data-testid="branch-order">{branch.branchOf('orders', 'O-1')?.id ?? '—'}</span>
      <span data-testid="branch-table">{branch.branchOf('tables', 22)?.id ?? '—'}</span>
      <span data-testid="branch-cash">{branch.branchOf('cash', 1)?.id ?? '—'}</span>
      <span data-testid="branch-miss">{branch.branchOf('orders', 'nope')?.id ?? '—'}</span>
      <span data-testid="shifts">{cashScope.cashShifts.length}</span>
      <span data-testid="movements">{cashScope.cashMovements.length}</span>
      <span data-testid="open-shift">{cashScope.openCashShift?.id ?? '—'}</span>
      <button
        type="button"
        onClick={() =>
          cashScope.setCashMovements((current) => [
            ...current,
            { id: 9 } as (typeof current)[number],
          ])
        }
      >
        sumar
      </button>
    </div>
  );
}

describe('hooks de scope', () => {
  it('filtra cuentas y resuelve la sucursal de cada ítem', () => {
    render(<Probe />);
    expect(screen.getByTestId('accounts').textContent).toBe('1');
    expect(screen.getByTestId('active-branch').textContent).toBe('miraflores');
    expect(screen.getByTestId('branch-order').textContent).toBe('miraflores');
    expect(screen.getByTestId('branch-table').textContent).toBe('surco');
    expect(screen.getByTestId('branch-cash').textContent).toBe('miraflores');
    expect(screen.getByTestId('branch-miss').textContent).toBe('miraflores');
    expect(screen.getByTestId('customers').textContent).toBe('1');
    expect(screen.getByTestId('coupons').textContent).toBe('1');
    expect(screen.getByTestId('expenses').textContent).toBe('1');
  });

  it('en la vista general no filtra cuentas y combina los movimientos', () => {
    tenant.isGeneral = true;
    render(<Probe />);
    expect(screen.getByTestId('accounts').textContent).toBe('2');
    expect(screen.getByTestId('shifts').textContent).toBe('2');
    expect(screen.getByTestId('movements').textContent).toBe('2');
  });

  it('escribe movimientos en la sucursal activa y en la vista general', () => {
    const { rerender } = render(<Probe />);
    expect(screen.getByTestId('movements').textContent).toBe('1');
    act(() => screen.getByText('sumar').click());
    expect(cash.setMovements).toHaveBeenCalledWith('miraflores', expect.any(Function));
    rerender(<Probe />);
    expect(screen.getByTestId('movements').textContent).toBe('2');

    tenant.isGeneral = true;
    rerender(<Probe />);
    act(() => screen.getByText('sumar').click());
    expect(cash.setMovementsByBranch).toHaveBeenCalled();
    rerender(<Probe />);
    expect(screen.getByTestId('movements').textContent).toBe('4');
  });
});
