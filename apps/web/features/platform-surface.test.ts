import { describe, expect, it } from 'vitest';

import { AUTH_LOGOUT_PATH, AUTH_SESSION_PATH } from './mod_auth/api';
import { billingApi } from './mod_billing/api';
import { onboardingApi } from './mod_onboarding/api';
import { saasApi } from './mod_saas/api';
import { tenantApi } from './mod_tenant/api';
import { featureModules, featureProviders, FeatureProviders } from './registry';
import * as realtime from './mod_realtime';

/**
 * F4/F5: fija las superficies públicas de las features de plataforma y el
 * transporte realtime sin tocar la red ni la sesión (BFF/`proxy.ts`).
 */
describe('superficies de plataforma', () => {
  it('expone las rutas de sesión del BFF', () => {
    expect(AUTH_SESSION_PATH).toBe('/api/session');
    expect(AUTH_LOGOUT_PATH).toBe('/api/session/logout');
  });

  it('expone las APIs delgadas de tenant, onboarding, saas y billing', () => {
    expect(typeof tenantApi.empresa).toBe('function');
    expect(typeof tenantApi.sucursales).toBe('function');
    expect(typeof onboardingApi.submit).toBe('function');
    expect(typeof saasApi.empresas).toBe('function');
    expect(typeof saasApi.suspender).toBe('function');
    expect(typeof billingApi.resumen).toBe('function');
  });

  it('reexporta el transporte realtime', () => {
    expect(typeof realtime.connectOrdersRealtime).toBe('function');
  });

  it('registra las 20 features sin pendientes', () => {
    expect(featureModules).toHaveLength(20);
    expect(featureProviders.map((provider) => provider.id)).toEqual([
      'mod_tenant',
      'mod_tables',
      'mod_reservations',
      'mod_orders',
      'mod_cash',
      'mod_receipts',
      'mod_expenses',
      'mod_inventory',
      'mod_promotions',
      'mod_crm',
      'mod_staff',
    ]);
    expect(typeof FeatureProviders).toBe('function');
  });
});
