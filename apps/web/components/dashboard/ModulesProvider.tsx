'use client';

/**
 * Fachada de compatibilidad (retiro de `ModulesProvider`).
 *
 * `useModules` es un **hook puro** que compone los contextos por módulo y el
 * estado derivado de la API: no hay `ModulesProvider`, ni contexto propio, ni
 * `ErpState`. Las vistas nuevas usan los hooks específicos
 * (`useSession`, `useTenant`, `useLiveData`, `useWorkspaceActions`, etc.); este
 * hook se mantiene para las que aún no se migraron.
 */

import { useMemo } from 'react';
import { initialPayments } from '@/lib/dashboard';
import type { TableAccount } from '@/lib/domain';
import { matchesBranch } from '@/lib/tenant-scope';
import { useAccounts } from '@/features/orders/provider';
import { useCrm } from '@/features/crm/provider';
import { useExpenses } from '@/features/expenses/provider';
import { useInventory } from '@/features/inventory/provider';
import { usePromotions } from '@/features/promotions/provider';
import { useReceipts } from '@/features/receipts/provider';
import { useStaff } from '@/features/staff/provider';
import { useCatalogoState } from './providers/catalog';
import { useLiveData } from './providers/live';
import { useNotifications } from './providers/notifications';
import { useSession } from './providers/session';
import { useTickets } from './providers/tickets';
import { useWorkspaceActions } from './providers/workspace-actions';
import { useBranchScope } from './hooks/use-branch-scope';
import { useCashScope } from './hooks/use-cash-scope';

export type { CheckoutInput } from '@/lib/checkout';
export type { ProductInput } from './providers/catalog';

export function useModules() {
  const { currentUser, hasSession, login, logout } = useSession();
  const { notifications, hasUnread, notify, clearUnread } = useNotifications();
  const {
    branches,
    company,
    tenant,
    activeBranch,
    activeBranchId,
    isGeneral,
    setActiveBranch,
    branchOf,
  } = useBranchScope();
  const catalog = useCatalogoState();
  const live = useLiveData();
  const { accounts } = useAccounts();
  const { receipts, setReceipts, enviarSunat, generarResumenDiario, sunatContingencia, toggleSunatContingencia } =
    useReceipts();
  const { expenses, setExpenses } = useExpenses();
  const { ingredients, setIngredients, movements, setMovements } = useInventory();
  const { roles, setRoles } = useStaff();
  const { customers, setCustomers } = useCrm();
  const { combos, setCombos, coupons, setCoupons } = usePromotions();
  const { tickets, setTickets } = useTickets();
  const { cashShifts, openCashShift, cashMovements, setCashMovements } = useCashScope();
  const actions = useWorkspaceActions();

  const activeAccounts: TableAccount[] = useMemo(
    () =>
      isGeneral
        ? accounts
        : accounts.filter((account) => matchesBranch(account.branchId, activeBranchId)),
    [accounts, activeBranchId, isGeneral],
  );

  return {
    /* Sesión y avisos */
    currentUser,
    hasSession,
    login,
    logout,
    notifications,
    hasUnread,
    notify,
    clearUnread,
    /* Tenant */
    company,
    tenant,
    branches,
    activeBranch,
    activeBranchId,
    isGeneral,
    setActiveBranch,
    branchOf,
    /* Catálogo */
    ...catalog,
    /* Operación de la API */
    orders: live.orders,
    setOrders: live.setOrders,
    ordersLoading: live.ordersLoading,
    ordersError: live.ordersError,
    refreshOrders: live.refreshOrders,
    tables: live.tables,
    setTables: live.setTables,
    tablesLoading: live.tablesLoading,
    tablesError: live.tablesError,
    refreshTables: live.refreshTables,
    reservations: live.reservations,
    setReservations: live.setReservations,
    reservationsLoading: live.reservationsLoading,
    reservationsError: live.reservationsError,
    refreshReservations: live.refreshReservations,
    /* Módulos */
    roles,
    setRoles,
    ingredients,
    setIngredients,
    movements,
    setMovements,
    customers,
    setCustomers,
    coupons,
    setCoupons,
    expenses,
    setExpenses,
    combos,
    setCombos,
    receipts,
    setReceipts,
    enviarSunat,
    generarResumenDiario,
    sunatContingencia,
    toggleSunatContingencia,
    /* Cuentas y caja */
    accounts: activeAccounts,
    cashShifts,
    openCashShift,
    cashMovements,
    setCashMovements,
    tickets,
    setTickets,
    payments: initialPayments,
    /* Acciones */
    ...actions,
  };
}
