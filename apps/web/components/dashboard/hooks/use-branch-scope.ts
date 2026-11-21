'use client';

/**
 * Sucursal activa y resolución de la sucursal de un ítem (retiro de
 * `ModulesProvider`). Hook puro: compone tenant + stores demo + caja.
 */

import { useCallback } from 'react';
import type { Branch, BranchScope } from '@/lib/tenancy';
import { GENERAL_BRANCH } from '@/lib/tenancy';
import { useCash } from '@/features/cash/provider';
import { useOrdersDemo } from '@/features/orders/provider';
import { useTables } from '@/features/tables/provider';
import { useTenant } from '@/features/tenant/provider';

export function useBranchScope() {
  const {
    company,
    tenant,
    branches,
    activeBranch,
    activeBranchId,
    isGeneral,
    setActiveBranch,
  } = useTenant();
  const { ordersByBranch } = useOrdersDemo();
  const { tablesByBranch } = useTables();
  const { movementsByBranch } = useCash();

  const branchOf = useCallback(
    (kind: keyof BranchScope | 'cash', id: number | string): Branch | null => {
      if (kind === 'cash') {
        for (const branch of branches) {
          const list = movementsByBranch[branch.id] ?? [];
          if (list.some((movement) => movement.id === id)) return branch;
        }
        return branches.find((branch) => branch.id !== GENERAL_BRANCH.id) ?? null;
      }
      for (const branch of branches) {
        const list = kind === 'orders' ? ordersByBranch[branch.id] ?? [] : tablesByBranch[branch.id] ?? [];
        if (list.some((item) => item.id === id)) return branch;
      }
      return branches.find((branch) => branch.id !== GENERAL_BRANCH.id) ?? null;
    },
    [branches, movementsByBranch, ordersByBranch, tablesByBranch],
  );

  return {
    company,
    tenant,
    branches,
    activeBranch,
    activeBranchId,
    isGeneral,
    setActiveBranch,
    branchOf,
  };
}
