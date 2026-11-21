'use client';

/**
 * Fachada del salón sobre los hooks por módulo.
 *
 * El ERP comparte un único estado de mesas, cuentas y reservas con mozo y caja,
 * así que la feature no lo duplica: expone solo la superficie que usan el mapa
 * y la agenda. La escritura vive en `api.ts`; el refresco, en `LiveDataProvider`.
 */

import { useLiveData } from '@/components/dashboard/providers/live';
import { useNotifications } from '@/components/dashboard/providers/notifications';
import { useSession } from '@/components/dashboard/providers/session';
import { useWorkspaceActions } from '@/components/dashboard/providers/workspace-actions';
import { useAccountsScope } from '@/components/dashboard/hooks/use-accounts-scope';
import { useBranchScope } from '@/components/dashboard/hooks/use-branch-scope';
import {
  useOrdersRealtime,
  type LiveEventKind,
  type LiveOrderEvent,
} from '@/lib/orders-realtime';
import type { RealtimeStatus } from '@/lib/realtime';

export function useSalon() {
  const {
    tables,
    setTables,
    reservations,
    setReservations,
    refreshTables,
    refreshReservations,
    tablesLoading,
    tablesError,
    reservationsLoading,
    reservationsError,
  } = useLiveData();
  const accounts = useAccountsScope();
  const { openAccount } = useWorkspaceActions();
  const { currentUser, hasSession } = useSession();
  const { notify } = useNotifications();
  const { isGeneral, branches, branchOf, activeBranchId } = useBranchScope();

  return {
    tables,
    setTables,
    reservations,
    setReservations,
    accounts,
    openAccount,
    currentUser,
    hasSession,
    notify,
    refreshTables,
    refreshReservations,
    tablesLoading,
    tablesError,
    reservationsLoading,
    reservationsError,
    isGeneral,
    branches,
    branchOf,
    activeBranchId,
  };
}

/** Un solo canal en vivo por pantalla: el mapa y la agenda releen al cambiar. */
export function useSalonEnVivo(
  enabled: boolean,
  onChange: (kind: LiveEventKind) => void,
): { status: RealtimeStatus; lastEvent: LiveOrderEvent | null } {
  return useOrdersRealtime(enabled, onChange);
}
