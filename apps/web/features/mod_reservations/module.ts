/**
 * Metadata del módulo Reservas para el registry/nav generado.
 * La entrada del sidebar (`Reservas`) vive en `modules/catalog.json`.
 */
export const reservationsModule = {
  id: 'mod_reservations',
  label: 'Reservas',
  icon: 'CalendarDays',
  path: '/app/modulos/reservas',
  roles: ['admin', 'sucursal'],
  group: 'Clientes',
  provider: 'ReservationsProvider',
};
