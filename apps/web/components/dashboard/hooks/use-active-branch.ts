'use client';

/** Sucursal activa para features que no pueden importar tenant directamente. */
import { useTenant } from '@/features/tenant/provider';

export function useActiveBranchId(): string {
  return useTenant().activeBranchId;
}
