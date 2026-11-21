'use client';

/** Cuentas de la sucursal activa (o todas en la vista agregada). */
import { useMemo } from 'react';
import { useAccounts } from '@/features/orders/provider';
import { useTenant } from '@/features/tenant/provider';
import { matchesBranch } from '@/lib/tenant-scope';

export function useAccountsScope() {
  const { accounts } = useAccounts();
  const { activeBranchId, isGeneral } = useTenant();
  return useMemo(
    () =>
      isGeneral
        ? accounts
        : accounts.filter((account) => matchesBranch(account.branchId, activeBranchId)),
    [accounts, activeBranchId, isGeneral],
  );
}
