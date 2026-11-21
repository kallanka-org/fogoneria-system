'use client';

/** Datos de fidelización compartidos entre CRM y caja (capa compartida). */
import { useCrm } from '@/features/crm/provider';
import { usePromotions } from '@/features/promotions/provider';

export function useLoyaltyData() {
  const { customers, setCustomers } = useCrm();
  const { coupons, setCoupons } = usePromotions();
  return { customers, setCustomers, coupons, setCoupons };
}
