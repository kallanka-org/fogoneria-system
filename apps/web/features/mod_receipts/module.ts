/**
 * Metadata del módulo Comprobantes para el registry/nav generado.
 * La entrada del sidebar (`Comprobantes`) vive en `modules/catalog.json`.
 */
export const receiptsModule = {
  id: 'mod_receipts',
  label: 'Comprobantes',
  icon: 'Receipt',
  path: '/app/comprobantes',
  roles: ['admin', 'sucursal', 'cajero'],
  group: 'Administración',
  provider: 'ReceiptsProvider',
};
