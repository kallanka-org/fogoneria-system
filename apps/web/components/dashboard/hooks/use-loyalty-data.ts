'use client';

/** Datos de fidelización compartidos entre CRM y caja (capa compartida). */
import { useCrm } from '@/features/mod_crm/provider';
import { usePromotions } from '@/features/mod_promotions/provider';

export function useLoyaltyData() {
  const { customers, setCustomers } = useCrm();
  const { coupons, setCoupons } = usePromotions();
  return { customers, setCustomers, coupons, setCoupons };
}
