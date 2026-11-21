'use client';

/**
 * Vista de caja por sucursal (retiro de `ModulesProvider`): turnos filtrados,
 * turno abierto, movimientos y el setter compatible con la distribución de la
 * vista `todas`. Hook puro sobre `useCash` + tenant.
 */

import { useCallback, useMemo } from 'react';
import type { CashMovement } from '@/lib/erp';
import { useCash } from '@/features/mod_cash/provider';
import { useTenant } from '@/features/mod_tenant/provider';

export function useCashScope() {
  const { branchIds, activeBranchId, isGeneral } = useTenant();
  const {
    cashShifts: allCashShifts,
    movementsByBranch,
    activeShift,
    setMovements,
    setMovementsByBranch,
  } = useCash();

  const writeBranchId = isGeneral ? branchIds[0] : activeBranchId;

  const cashShifts = useMemo(
    () =>
      isGeneral
        ? allCashShifts
        : allCashShifts.filter((shift) => shift.branchId === activeBranchId),
    [activeBranchId, allCashShifts, isGeneral],
  );

  const openCashShift = useMemo(
    () => activeShift(writeBranchId),
    [activeShift, writeBranchId],
  );

  const cashMovements = useMemo(
    () =>
      isGeneral
        ? branchIds.flatMap((id) => movementsByBranch[id] ?? [])
        : movementsByBranch[activeBranchId] ?? [],
    [activeBranchId, branchIds, isGeneral, movementsByBranch],
  );

  const setCashMovements = useCallback(
    (value: React.SetStateAction<CashMovement[]>) => {
      const apply = (current: CashMovement[]) =>
        typeof value === 'function' ? value(current) : value;
      if (!isGeneral) {
        setMovements(activeBranchId, apply);
        return;
      }
      setMovementsByBranch((prev) => {
        const combined = branchIds.flatMap((id) => prev[id] ?? []);
        const next = apply(combined);
        const knownIds = new Set(combined.map((movement) => movement.id));
        const fresh = next.filter((movement) => !knownIds.has(movement.id));
        const out = { ...prev };
        branchIds.forEach((id, i) => {
          const own = new Set((prev[id] ?? []).map((movement) => movement.id));
          const slice = next.filter((movement) => own.has(movement.id));
          out[id] = i === 0 ? [...slice, ...fresh] : slice;
        });
        return out;
      });
    },
    [activeBranchId, branchIds, isGeneral, setMovements, setMovementsByBranch],
  );

  return { cashShifts, openCashShift, cashMovements, setCashMovements };
}
