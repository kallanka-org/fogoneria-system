'use client';

/** Sucursal activa para features que no pueden importar tenant directamente. */
import { useTenant } from '@/features/mod_tenant/provider';

export function useActiveBranchId(): string {
  return useTenant().activeBranchId;
}
