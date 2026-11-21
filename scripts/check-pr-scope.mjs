#!/usr/bin/env node
/**
 * Regla «un PR = un módulo» (2026-11-18).
 *
 * Clasifica los archivos tocados por un PR y falla si afecta a **más de un
 * módulo de negocio**. Los archivos compartidos (docs, CI, design system,
 * migraciones, tests) no cuentan como módulo.
 *
 * Uso:
 *   node scripts/check-pr-scope.mjs <base> <head>
 *
 * Ejemplo en CI:
 *   node scripts/check-pr-scope.mjs origin/development "$GITHUB_SHA"
 *
 * Escape: el PR puede llevar la etiqueta `multi-modulo` (ALLOW_MULTI=true) para
 * un refactor que cruce módulos con aprobación explícita del equipo.
 */

import { execFileSync } from 'node:child_process';

const [, , base, head] = process.argv;

if (!base || !head) {
  console.error('uso: node scripts/check-pr-scope.mjs <base> <head>');
  process.exit(2);
}

const MODULOS = {
  'api:mod_auth': 'mod_auth',
  'api:mod_tenant': 'mod_tenant',
  'api:mod_onboarding': 'mod_onboarding',
  'api:mod_saas': 'mod_saas',
  'api:mod_billing': 'mod_billing',
  'api:mod_audit': 'mod_audit',
  'api:mod_catalog': 'mod_catalog',
  'api:mod_pricing': 'mod_pricing',
  'api:mod_tables': 'mod_tables',
  'api:mod_reservations': 'mod_reservations',
  'api:mod_orders': 'mod_orders',
  'api:mod_realtime': 'mod_realtime',
  'api:mod_cash': 'mod_cash',
  'api:mod_receipts': 'mod_receipts',
  'api:mod_expenses': 'mod_expenses',
  'api:mod_inventory': 'mod_inventory',
  'api:mod_promotions': 'mod_promotions',
  'api:mod_crm': 'mod_crm',
  'api:mod_staff': 'mod_staff',
  'api:mod_bi': 'mod_bi',
};

const VISTAS = {
  OrdersView: 'mod_orders',
  MozoView: 'mod_orders',
  AccountPanel: 'mod_orders',
  useOrdersRealtime: 'mod_realtime',
  BookingsModule: 'mod_reservations',
  BookingsWorkspace: 'mod_reservations',
  SalonTablesView: 'mod_tables',
  CajaView: 'mod_cash',
  ComprobantesView: 'mod_receipts',
  InventoryModule: 'mod_inventory',
  InventoryMovementsView: 'mod_inventory',
  GastosView: 'mod_expenses',
  CombosView: 'mod_promotions',
  PromocionesView: 'mod_promotions',
  ClientesView: 'mod_crm',
  LoyaltyModule: 'mod_crm',
  StaffAttendanceView: 'mod_staff',
  StaffTurnosView: 'mod_staff',
  StaffModule: 'mod_staff',
  RolesView: 'mod_staff',
  AnaliticasView: 'mod_bi',
  AuditPage: 'mod_audit',
  CartaVirtualView: 'mod_catalog',
  ProductsView: 'mod_catalog',
  CategoriesView: 'mod_catalog',
  ModifiersView: 'mod_catalog',
  PriceListsView: 'mod_pricing',
};

const FEATURES = {
  mod_catalog: 'mod_catalog',
  mod_pricing: 'mod_pricing',
  mod_tables: 'mod_tables',
  mod_reservations: 'mod_reservations',
  mod_orders: 'mod_orders',
  mod_cash: 'mod_cash',
  mod_receipts: 'mod_receipts',
  mod_expenses: 'mod_expenses',
  mod_inventory: 'mod_inventory',
  mod_promotions: 'mod_promotions',
  mod_crm: 'mod_crm',
  mod_staff: 'mod_staff',
  mod_bi: 'mod_bi',
  // Alias deprecados de contratos y nombres anteriores.
  catalogo: 'mod_catalog',
  salon: 'mod_tables',
  mesas: 'mod_tables',
  reservas: 'mod_reservations',
  caja: 'mod_cash',
  comprobantes: 'mod_receipts',
  gastos: 'mod_expenses',
  inventario: 'mod_inventory',
  ordenes: 'mod_orders',
  promociones: 'mod_promotions',
  rrhh: 'mod_staff',
  'tiempo-real': 'mod_realtime',
};

const LIB = {
  catalog: 'mod_catalog',
  pricing: 'mod_pricing',
  tables: 'mod_tables',
  reservations: 'mod_reservations',
  orders: 'mod_orders',
  realtime: 'mod_realtime',
  cash: 'mod_cash',
  receipts: 'mod_receipts',
  expenses: 'mod_expenses',
  inventory: 'mod_inventory',
  promotions: 'mod_promotions',
  crm: 'mod_crm',
  staff: 'mod_staff',
  bi: 'mod_bi',
  'orders-board': 'mod_orders',
  'orders-realtime': 'mod_realtime',
};

const RUTAS = [
  [/^apps\/web\/app\/app\/(caja|comprobantes|clientes|analiticas|gastos|combos|promociones)(\/|$)/, (m) => ({
    caja: 'mod_cash',
    comprobantes: 'mod_receipts',
    clientes: 'mod_crm',
    analiticas: 'mod_bi',
    gastos: 'mod_expenses',
    combos: 'mod_promotions',
    promociones: 'mod_promotions',
  })[m[1]]],
  [/^apps\/web\/app\/app\/(ordenes|cocina|mozo)(\/|$)/, () => 'mod_orders'],
  [/^apps\/web\/app\/app\/productos\/precios(\/|$)/, () => 'mod_pricing'],
  [/^apps\/web\/app\/app\/productos(\/|$)/, () => 'mod_catalog'],
  [/^apps\/web\/app\/app\/mesas(\/|$)/, () => 'mod_tables'],
  [/^apps\/web\/app\/app\/modulos\/reservas(\/|$)/, () => 'mod_reservations'],
  [/^apps\/web\/app\/app\/modulos\/inventario(\/|$)/, () => 'mod_inventory'],
  [/^apps\/web\/app\/app\/modulos\/personal(\/|$)/, () => 'mod_staff'],
  [/^apps\/web\/app\/app\/modulos\/fidelizacion(\/|$)/, () => 'mod_crm'],
  [/^apps\/web\/app\/app\/auditoria(\/|$)/, () => 'mod_audit'],
];

/** Devuelve la clave del módulo o `null` si el archivo es compartido. */
function moduloDe(archivo) {
  if (archivo.startsWith('docs/') || archivo.endsWith('.md')) return null;
  if (archivo.startsWith('.github/') || archivo.startsWith('scripts/')) return null;
  if (archivo.startsWith('db/')) return null;
  if (archivo.startsWith('apps/api/test/')) return null;

  // Schema Prisma multi-archivo: cada módulo es dueño de su `<id>.prisma`;
  // `core.prisma` y el resto de `prisma/` son compartidos.
  const prismaModulo = /^apps\/api\/prisma\/schema\/([a-z0-9_-]+)\.prisma$/.exec(archivo);
  if (prismaModulo) {
    if (prismaModulo[1] === 'core') return null;
    return MODULOS[`api:${prismaModulo[1]}`] ?? prismaModulo[1];
  }
  if (archivo.startsWith('apps/api/prisma/')) return null;

  // Contratos por módulo: `packages/contracts/src/<m>.ts`.
  const contrato = /^packages\/contracts\/src\/([a-z0-9_-]+)\.ts$/.exec(archivo);
  if (contrato && contrato[1] !== 'index') {
    // `plataforma` se reparte en la Fase 4; hasta entonces es compartido.
    if (contrato[1] === 'plataforma') return null;
    return FEATURES[contrato[1]] ?? contrato[1];
  }
  // Kernel, SDK y UI son plataforma compartida.
  if (archivo.startsWith('packages/')) return null;

  // Features del frontend: `apps/web/features/<m>/**`.
  const feature = /^apps\/web\/features\/([^/]+)\//.exec(archivo);
  if (feature) {
    // La feature web de plataforma sigue agrupada hasta la Fase 4.
    if (feature[1] === 'plataforma') return null;
    return FEATURES[feature[1]] ?? feature[1];
  }
  if (
    archivo === 'package.json' ||
    archivo === 'pnpm-lock.yaml' ||
    archivo === 'turbo.json' ||
    archivo === 'docker-compose.yml' ||
    archivo.endsWith('tsconfig.json') ||
    archivo.endsWith('.example') ||
    archivo.startsWith('apps/web/components/ui/') ||
    archivo.startsWith('apps/web/components/dashboard/') ||
    archivo === 'apps/web/app/globals.css' ||
    archivo === 'apps/web/proxy.ts' ||
    archivo === 'apps/web/next.config.ts' ||
    archivo === 'apps/web/scripts/check-styles.mjs'
  ) {
    return null;
  }

  const api = /^apps\/api\/src\/modules\/([^/]+)\//.exec(archivo);
  if (api) return MODULOS[`api:${api[1]}`] ?? api[1];

  const lib = /^apps\/web\/lib\/([a-z-]+?)(?:-api)?\.tsx?$/.exec(archivo);
  if (lib) {
    // Sesión/BFF, RBAC y auth web son la autoridad compartida hasta la Fase 4.
    if (['session', 'backend', 'mod_auth'].includes(lib[1])) return null;
    if (lib[1] === 'order-mapping') return 'mod_orders';
    if (lib[1] === 'table-mapping') return 'mod_tables';
    if (lib[1] === 'receipt-mapping') return 'mod_receipts';
    return LIB[lib[1]] ?? null;
  }

  const vista = /^apps\/web\/components\/erp\/(?:.*\/)?([A-Za-z0-9]+)\.tsx$/.exec(archivo);
  if (vista) {
    if (archivo.includes('/catalog/')) return 'mod_catalog';
    return VISTAS[vista[1]] ?? null;
  }

  for (const [patron, resolver] of RUTAS) {
    const match = patron.exec(archivo);
    if (match) return resolver(match);
  }

  return null;
}

let archivos;
try {
  archivos = execFileSync('git', ['diff', '--name-only', `${base}...${head}`], { encoding: 'utf8' })
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean);
} catch (error) {
  console.error(`No se pudo calcular el diff: ${error.message}`);
  process.exit(2);
}

if (archivos.length === 0) {
  console.log('Sin cambios: nada que validar.');
  process.exit(0);
}

const porModulo = new Map();
const compartidos = [];
for (const archivo of archivos) {
  const modulo = moduloDe(archivo);
  if (modulo) {
    if (!porModulo.has(modulo)) porModulo.set(modulo, []);
    porModulo.get(modulo).push(archivo);
  } else {
    compartidos.push(archivo);
  }
}

console.log('Alcance del PR:');
for (const [modulo, lista] of porModulo) {
  console.log(`  ${modulo} (${lista.length} archivo${lista.length === 1 ? '' : 's'})`);
}
if (compartidos.length) {
  console.log(`  compartidos (${compartidos.length}): docs, CI, tests, migraciones o design system`);
}

if (porModulo.size > 1) {
  const detalle = [...porModulo.entries()]
    .map(([modulo, lista]) => `  - ${modulo}:\n${lista.map((f) => `      ${f}`).join('\n')}`)
    .join('\n');

  if (process.env.ALLOW_MULTI === 'true') {
    console.warn(
      `\n⚠️  El PR toca ${porModulo.size} módulos y lleva la etiqueta multi-modulo: se permite con aprobación explícita.\n${detalle}`,
    );
    process.exit(0);
  }

  console.error(
    `\n❌ Un PR = un módulo. Este toca ${porModulo.size}: ${[...porModulo.keys()].join(', ')}.\n${detalle}\n\n` +
      'Separa el trabajo en un PR por módulo. Si el cambio cruza módulos de verdad ' +
      '(refactor de contrato), pide la etiqueta `multi-modulo` al equipo y justifícalo en la descripción.',
  );
  process.exit(1);
}

console.log('\n✅ PR dentro de un solo módulo.');
