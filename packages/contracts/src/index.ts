/**
 * Barrel de contratos para bundlers y type-checking de la web.
 *
 * **La API no importa este barrel**: Node 24 carga los `.ts` por subpath
 * (`@fogoneria/contracts/tiempo-real`) con type stripping, y los reexports sin
 * extensión de este archivo no resuelven en runtime. Usa siempre el subpath.
 */
export * from './mod_bi';
export * from './mod_auth';
export * from './mod_audit';
export * from './mod_billing';
export * from './mod_catalog';
export * from './mod_pricing';
export * from './mod_cash';
export * from './mod_receipts';
export * from './mod_crm';
export * from './mod_expenses';
export * from './mod_inventory';
export * from './mod_tables';
export * from './mod_orders';
export * from './mod_onboarding';
export * from './mod_promotions';
export * from './mod_realtime';
export * from './mod_reservations';
export * from './mod_saas';
export * from './mod_staff';
export * from './mod_tenant';

/**
 * `caja` e `inventario` tienen cada uno su `etiquetaTipoMovimiento` (movimientos
 * de caja vs. kardex). El root conserva el de caja por compatibilidad; el
 * inventario se consume por `@fogoneria/contracts/mod_inventory`.
 */
export { etiquetaTipoMovimiento } from './mod_cash';
