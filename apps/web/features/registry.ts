/**
 * GENERADO por scripts/gen-modules.mjs — no editar a mano.
 * Regenera con `pnpm gen:modules`.
 *
 * Fase 6: lista las features y compone los providers opcionales de `module.ts`.
 * El layout consume `FeatureProviders`.
 */
import { createElement, type ComponentType, type ReactNode } from 'react';
import { authModule } from './mod_auth/module';
import { tenantModule } from './mod_tenant/module';
import { onboardingModule } from './mod_onboarding/module';
import { saasModule } from './mod_saas/module';
import { billingModule } from './mod_billing/module';
import { auditModule } from './mod_audit/module';
import { catalogModule } from './mod_catalog/module';
import { pricingModule } from './mod_pricing/module';
import { tablesModule } from './mod_tables/module';
import { reservationsModule } from './mod_reservations/module';
import { ordersModule } from './mod_orders/module';
import { realtimeModule } from './mod_realtime/module';
import { cashModule } from './mod_cash/module';
import { receiptsModule } from './mod_receipts/module';
import { expensesModule } from './mod_expenses/module';
import { inventoryModule } from './mod_inventory/module';
import { promotionsModule } from './mod_promotions/module';
import { crmModule } from './mod_crm/module';
import { staffModule } from './mod_staff/module';
import { biModule } from './mod_bi/module';
import { TenantProvider } from './mod_tenant/provider';
import { TablesProvider } from './mod_tables/provider';
import { ReservationsProvider } from './mod_reservations/provider';
import { AccountsProvider } from './mod_orders/provider';
import { CashProvider } from './mod_cash/provider';
import { ReceiptsProvider } from './mod_receipts/provider';
import { ExpensesProvider } from './mod_expenses/provider';
import { InventoryProvider } from './mod_inventory/provider';
import { PromotionsProvider } from './mod_promotions/provider';
import { CrmProvider } from './mod_crm/provider';
import { StaffProvider } from './mod_staff/provider';

export type FeatureModule = {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: string[];
  group: string;
  provider?: string;
};

export type FeatureProvider = {
  id: string;
  Provider: ComponentType<{ children: ReactNode }>;
};

export const featureModules: FeatureModule[] = [
  authModule,
  tenantModule,
  onboardingModule,
  saasModule,
  billingModule,
  auditModule,
  catalogModule,
  pricingModule,
  tablesModule,
  reservationsModule,
  ordersModule,
  realtimeModule,
  cashModule,
  receiptsModule,
  expensesModule,
  inventoryModule,
  promotionsModule,
  crmModule,
  staffModule,
  biModule,
];

/** Módulos del catálogo que aún no exponen `features/<id>/module.ts`. */
export const pendingFeatureIds = [];

/** Providers opcionales por módulo (Fase 6). */
export const featureProviders: FeatureProvider[] = [
  { id: "mod_tenant", Provider: TenantProvider },
  { id: "mod_tables", Provider: TablesProvider },
  { id: "mod_reservations", Provider: ReservationsProvider },
  { id: "mod_orders", Provider: AccountsProvider },
  { id: "mod_cash", Provider: CashProvider },
  { id: "mod_receipts", Provider: ReceiptsProvider },
  { id: "mod_expenses", Provider: ExpensesProvider },
  { id: "mod_inventory", Provider: InventoryProvider },
  { id: "mod_promotions", Provider: PromotionsProvider },
  { id: "mod_crm", Provider: CrmProvider },
  { id: "mod_staff", Provider: StaffProvider },
];

/** Envuelve a los hijos con los providers de las features que los declaran. */
export function FeatureProviders({ children }: { children: ReactNode }): ReactNode {
  return featureProviders.reduceRight<ReactNode>(
    (wrapped, { Provider }) => createElement(Provider, null, wrapped),
    children,
  );
}
