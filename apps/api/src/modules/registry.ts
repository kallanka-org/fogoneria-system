/**
 * GENERADO por scripts/gen-modules.mjs — no editar a mano.
 * Regenera con `pnpm gen:modules`; el CI lo compara con `pnpm gen:modules --check`.
 *
 * Orden: el de modules/catalog.json. Los módulos de infraestructura
 * (`PrismaModule`, `TenantContextModule`) se declaran en app.module.ts.
 */
import { AuthModule } from './mod_auth/index.js';
import { TenantModule } from './mod_tenant/index.js';
import { OnboardingModule } from './mod_onboarding/index.js';
import { SaasModule } from './mod_saas/index.js';
import { BillingModule } from './mod_billing/index.js';
import { AuditModule } from './mod_audit/index.js';
import { CatalogModule } from './mod_catalog/index.js';
import { PricingModule } from './mod_pricing/index.js';
import { TablesModule } from './mod_tables/index.js';
import { ReservationsModule } from './mod_reservations/index.js';
import { OrdersModule } from './mod_orders/index.js';
import { RealtimeModule } from './mod_realtime/index.js';
import { CashModule } from './mod_cash/index.js';
import { ReceiptsModule } from './mod_receipts/index.js';
import { ExpensesModule } from './mod_expenses/index.js';
import { InventoryModule } from './mod_inventory/index.js';
import { PromotionsModule } from './mod_promotions/index.js';
import { CrmModule } from './mod_crm/index.js';
import { StaffModule } from './mod_staff/index.js';
import { BiModule } from './mod_bi/index.js';

export const MODULE_REGISTRY = [
  AuthModule,
  TenantModule,
  OnboardingModule,
  SaasModule,
  BillingModule,
  AuditModule,
  CatalogModule,
  PricingModule,
  TablesModule,
  ReservationsModule,
  OrdersModule,
  RealtimeModule,
  CashModule,
  ReceiptsModule,
  ExpensesModule,
  InventoryModule,
  PromotionsModule,
  CrmModule,
  StaffModule,
  BiModule,
];
