import { describe, expect, it } from 'vitest';

import * as cash from './mod_cash';
import * as cashAlias from './cash';
import * as cashLegacy from './caja';
import * as audit from './mod_audit';
import * as auditAlias from './audit';
import * as auth from './mod_auth';
import * as authAlias from './auth';
import * as bi from './mod_bi';
import * as biAlias from './bi';
import * as billing from './mod_billing';
import * as billingAlias from './billing';
import * as catalog from './mod_catalog';
import * as catalogAlias from './catalog';
import * as catalogLegacy from './catalogo';
import * as crm from './mod_crm';
import * as crmAlias from './crm';
import * as expenses from './mod_expenses';
import * as expensesAlias from './expenses';
import * as expensesLegacy from './gastos';
import * as inventory from './mod_inventory';
import * as inventoryAlias from './inventory';
import * as inventoryLegacy from './inventario';
import * as onboarding from './mod_onboarding';
import * as onboardingAlias from './onboarding';
import * as orders from './mod_orders';
import * as ordersAlias from './orders';
import * as ordersLegacy from './ordenes';
import * as platform from './mod_auth';
import * as platformAlias from './plataforma';
import * as platformBilling from './mod_billing';
import * as platformOnboarding from './mod_onboarding';
import * as platformSaas from './mod_saas';
import * as platformTenant from './mod_tenant';
import * as pricing from './mod_pricing';
import * as pricingAlias from './pricing';
import * as promotions from './mod_promotions';
import * as promotionsAlias from './promotions';
import * as promotionsLegacy from './promociones';
import * as realtime from './mod_realtime';
import * as realtimeAlias from './realtime';
import * as realtimeLegacy from './tiempo-real';
import * as receipts from './mod_receipts';
import * as receiptsAlias from './receipts';
import * as receiptsLegacy from './comprobantes';
import * as reservations from './mod_reservations';
import * as reservationsAlias from './reservations';
import * as reservationsLegacy from './reservas';
import * as saas from './mod_saas';
import * as saasAlias from './saas';
import * as staff from './mod_staff';
import * as staffAlias from './staff';
import * as staffLegacy from './rrhh';
import * as tables from './mod_tables';
import * as tablesAlias from './tables';
import * as tablesLegacy from './mesas';
import * as tenant from './mod_tenant';
import * as tenantAlias from './tenant';

/** Alias de los nombres canónicos anteriores al prefijo `mod_`. */
const canonicalAliases = [
  ['audit', auditAlias, audit],
  ['auth', authAlias, auth],
  ['bi', biAlias, bi],
  ['billing', billingAlias, billing],
  ['catalog', catalogAlias, catalog],
  ['cash', cashAlias, cash],
  ['crm', crmAlias, crm],
  ['expenses', expensesAlias, expenses],
  ['inventory', inventoryAlias, inventory],
  ['onboarding', onboardingAlias, onboarding],
  ['orders', ordersAlias, orders],
  ['pricing', pricingAlias, pricing],
  ['promotions', promotionsAlias, promotions],
  ['realtime', realtimeAlias, realtime],
  ['receipts', receiptsAlias, receipts],
  ['reservations', reservationsAlias, reservations],
  ['saas', saasAlias, saas],
  ['staff', staffAlias, staff],
  ['tables', tablesAlias, tables],
  ['tenant', tenantAlias, tenant],
] as const;

/**
 * Los subpaths antiguos quedan como alias deprecados durante una release.
 * Este test fija que reexportan exactamente el contrato nuevo.
 */
const aliases = [
  ['caja', 'cash', cashLegacy, cash],
  ['catalogo', 'catalog+pricing', catalogLegacy, { ...catalog, ...pricing }],
  ['comprobantes', 'receipts', receiptsLegacy, receipts],
  ['gastos', 'expenses', expensesLegacy, expenses],
  ['inventario', 'inventory', inventoryLegacy, inventory],
  ['mesas', 'tables', tablesLegacy, tables],
  ['ordenes', 'orders', ordersLegacy, orders],
  [
    'plataforma',
    'auth+tenant+onboarding+saas+billing',
    platformAlias,
    { ...platform, ...platformTenant, ...platformOnboarding, ...platformSaas, ...platformBilling },
  ],
  ['promociones', 'promotions', promotionsLegacy, promotions],
  ['tiempo-real', 'realtime', realtimeLegacy, realtime],
  ['reservas', 'reservations', reservationsLegacy, reservations],
  ['rrhh', 'staff', staffLegacy, staff],
] as const;

describe('alias deprecados de contratos', () => {
  for (const [canonicalName, alias, canonical] of canonicalAliases) {
    it(`./${canonicalName} reexporta ./mod_${canonicalName}`, () => {
      expect(Object.keys(alias).sort()).toEqual(Object.keys(canonical).sort());
    });
  }

  for (const [legacyName, canonicalName, legacy, canonical] of aliases) {
    it(`./${legacyName} reexporta ./${canonicalName}`, () => {
      expect(Object.keys(legacy).sort()).toEqual(Object.keys(canonical).sort());
    });
  }

  it('los valores son las mismas referencias', () => {
    expect(cashLegacy.etiquetaMetodo).toBe(cash.etiquetaMetodo);
    expect(receiptsLegacy.desgloseIgv).toBe(receipts.desgloseIgv);
    expect(ordersLegacy.estadoKdsDeApi).toBe(orders.estadoKdsDeApi);
    expect(staffLegacy.etiquetaBloque).toBe(staff.etiquetaBloque);
  });
});
