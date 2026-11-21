/**
 * Metadata del módulo Inventario para el registry/nav generado.
 * La entrada del sidebar (`Inventario`) vive en `modules/catalog.json`.
 */
export const inventoryModule = {
  id: 'mod_inventory',
  label: 'Inventario',
  icon: 'Warehouse',
  path: '/app/modulos/inventario',
  roles: ['admin', 'sucursal'],
  group: 'Administración',
  provider: 'InventoryProvider',
};
