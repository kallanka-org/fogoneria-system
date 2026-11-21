'use client';

/**
 * Estado derivado de la API (F6c3/retiro): comandas, mesas y reservas reales,
 * migración del `ErpState` legacy y remapeo slug→UUID de los stores demo.
 *
 * Se monta una sola vez en `app/layout.tsx`, debajo de `FeatureProviders` y
 * `CatalogoProvider`. No posee estado de negocio: lo demo vive en los providers
 * de cada módulo; aquí solo se cachea lo que devuelve la API y se orquesta la
 * carga/realtime.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Order, Reservation, Table } from '@/lib/erp';
import type { Expense, Role } from '@/lib/erp';
import type { Ticket } from '@/lib/dashboard';
import type { TableAccount } from '@/lib/domain';
import {
  GENERAL_BRANCH,
  SEED_SLUG_BRANCH_IDS,
} from '@/lib/tenancy';
import { ApiError } from '@/lib/api';
import * as ordersApi from '@/lib/orders-api';
import { orderFromApi, reconcileAccounts } from '@/lib/order-mapping';
import { connectOrdersRealtime } from '@/lib/realtime';
import { listReservations } from '@/lib/reservations-api';
import { limaTodayKey, reservationsFromApi, tablesFromApi } from '@/lib/table-mapping';
import { listTables } from '@/lib/tables-api';
import {
  migrateLegacyArray,
  migrateLegacyCash,
  migrateLegacyInventory,
  migrateLegacyPromotions,
  migrateLegacyReceipts,
  migrateLegacyScopes,
  readModuleValue,
  saveModuleValue,
  type CashStoreState,
  type InventoryStoreState,
  type LegacyErpState as LegacyModuleState,
  type PromotionsStoreState,
  type ReceiptsStoreState,
} from '@/lib/module-store';
import {
  migrateLegacyCustomers,
  readCrmCustomers,
  saveCrmCustomers,
  type LegacyErpState,
} from '@/lib/crm-storage';
import { loadErpState, resetErpState } from '@/lib/persistence';
import { tenantKeyOf } from '@/lib/session-state';
import {
  useAccounts,
  useOrdersDemo,
} from '@/features/orders/provider';
import { useCash } from '@/features/cash/provider';
import { usePromotions } from '@/features/promotions/provider';
import { useReservations } from '@/features/reservations/provider';
import { useTables } from '@/features/tables/provider';
import { useCatalogoState } from './catalog';
import { useSession } from './session';
import { useTenant } from '@/features/tenant/provider';

type LiveDataContextValue = {
  /** `null` sin sesión: las vistas usan el demo del provider. */
  orders: Order[];
  ordersLoading: boolean;
  ordersError: string | null;
  refreshOrders: (signal?: AbortSignal) => Promise<void>;
  tables: Table[];
  tablesLoading: boolean;
  tablesError: string | null;
  refreshTables: (signal?: AbortSignal) => Promise<void>;
  reservations: Reservation[];
  reservationsLoading: boolean;
  reservationsError: string | null;
  refreshReservations: (fecha?: string, signal?: AbortSignal) => Promise<void>;
  setOrders: (value: React.SetStateAction<Order[]>) => void;
  setTables: (value: React.SetStateAction<Table[]>) => void;
  setReservations: (reservations: Reservation[]) => void;
  setOrdersError: (message: string | null) => void;
};

const LiveDataContext = createContext<LiveDataContextValue | null>(null);

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useSession();
  const {
    branchIds,
    activeBranchId,
    isGeneral,
    realBranches,
    loading: tenantLoading,
    error: tenantError,
  } = useTenant();
  const { products, catalogVersion } = useCatalogoState();
  const { accounts, setAccounts } = useAccounts();
  const {
    ordersByBranch,
    setOrdersForBranches,
    ensureDemoOrders,
    remapBranches: remapOrdersBranches,
  } = useOrdersDemo();
  const {
    tablesByBranch,
    setTablesForBranches,
    ensureDemoTables,
    remapBranches: remapTablesBranches,
  } = useTables();
  const {
    reservations: demoReservations,
    setReservations: setDemoReservations,
  } = useReservations();
  const { cashShifts, movementsByBranch, remapBranches: remapCashBranches } = useCash();
  const { combos, setCombos } = usePromotions();

  const tenantKey = tenantKeyOf(currentUser);
  const empresaId = currentUser?.empresaId ?? null;

  /* Migración final del ErpState legacy: los providers ya hidrataron sus
     claves; aquí se extraen los slices restantes y se borra la clave. */
  useEffect(() => {
    const saved = loadErpState(tenantKey) as LegacyErpState | null;
    if (!saved) return;
    let next = saved as LegacyModuleState;

    const crm = migrateLegacyCustomers(next as LegacyErpState, readCrmCustomers(tenantKey));
    if (crm.migrated) {
      saveCrmCustomers(tenantKey, crm.migrated);
      next = crm.state as LegacyModuleState;
    }
    const expensesMigration = migrateLegacyArray(
      next,
      'expenses',
      readModuleValue<Expense[]>('expenses', tenantKey),
    );
    if (expensesMigration.migrated) {
      saveModuleValue('expenses', tenantKey, expensesMigration.migrated);
      next = expensesMigration.state as LegacyModuleState;
    }
    const inventoryMigration = migrateLegacyInventory(
      next,
      readModuleValue<InventoryStoreState>('inventory', tenantKey),
    );
    if (inventoryMigration.migrated) {
      saveModuleValue('inventory', tenantKey, inventoryMigration.migrated);
      next = inventoryMigration.state as LegacyModuleState;
    }
    const staffMigration = migrateLegacyArray(
      next,
      'roles',
      readModuleValue<Role[]>('staff', tenantKey),
    );
    if (staffMigration.migrated) {
      saveModuleValue('staff', tenantKey, staffMigration.migrated);
      next = staffMigration.state as LegacyModuleState;
    }
    const accountsMigration = migrateLegacyArray(
      next,
      'accounts',
      readModuleValue<TableAccount[]>('orders', tenantKey),
    );
    if (accountsMigration.migrated) {
      saveModuleValue('orders', tenantKey, accountsMigration.migrated);
      next = accountsMigration.state as LegacyModuleState;
    }
    const cashMigration = migrateLegacyCash(
      next,
      readModuleValue<CashStoreState>('cash', tenantKey),
    );
    if (cashMigration.migrated) {
      saveModuleValue('cash', tenantKey, cashMigration.migrated);
      next = cashMigration.state as LegacyModuleState;
    }
    const receiptsMigration = migrateLegacyReceipts(
      next,
      readModuleValue<ReceiptsStoreState>('receipts', tenantKey),
    );
    if (receiptsMigration.migrated) {
      saveModuleValue('receipts', tenantKey, receiptsMigration.migrated);
      next = receiptsMigration.state as LegacyModuleState;
    }
    const promotionsMigration = migrateLegacyPromotions(
      next,
      readModuleValue<PromotionsStoreState>('promotions', tenantKey),
    );
    if (promotionsMigration.migrated) {
      saveModuleValue('promotions', tenantKey, promotionsMigration.migrated);
      next = promotionsMigration.state as LegacyModuleState;
    }
    const scopesMigration = migrateLegacyScopes(
      next,
      readModuleValue<Record<string, Order[]>>('orders-demo', tenantKey),
      readModuleValue<Record<string, Table[]>>('tables-demo', tenantKey),
    );
    if (scopesMigration.migrated) {
      saveModuleValue('orders-demo', tenantKey, scopesMigration.migrated.ordersByBranch);
      saveModuleValue('tables-demo', tenantKey, scopesMigration.migrated.tablesByBranch);
      next = scopesMigration.state as LegacyModuleState;
    }
    const reservationsMigration = migrateLegacyArray(
      next,
      'reservations',
      readModuleValue<Reservation[]>('reservations', tenantKey),
    );
    if (reservationsMigration.migrated) {
      saveModuleValue('reservations', tenantKey, reservationsMigration.migrated);
      next = reservationsMigration.state as LegacyModuleState;
    }
    const ticketsMigration = migrateLegacyArray(
      next,
      'tickets',
      readModuleValue<Ticket[]>('tickets', tenantKey),
    );
    if (ticketsMigration.migrated) {
      saveModuleValue('tickets', tenantKey, ticketsMigration.migrated);
      next = ticketsMigration.state as LegacyModuleState;
    }
    resetErpState(tenantKey);
    void next;
  }, [tenantKey]);

  /* Asegura la operación demo de las sucursales reales (remap slug→UUID). */
  const preparedBranches = useRef<string | null>(null);
  useEffect(() => {
    if (!currentUser || tenantLoading || tenantError || !empresaId) return;
    const ids = realBranches.map((branch) => branch.id);
    const signature = `${empresaId}:${ids.join(',')}`;
    if (preparedBranches.current === signature) return;
    preparedBranches.current = signature;
    ensureDemoOrders(ids);
    ensureDemoTables(ids);
  }, [currentUser, empresaId, ensureDemoOrders, ensureDemoTables, realBranches, tenantError, tenantLoading]);

  /* Remapeo idempotente de cuentas, caja y scopes demo a UUID reales. */
  useEffect(() => {
    if (!currentUser || tenantLoading || tenantError || !empresaId) return;
    if (realBranches.length === 0) return;
    setAccounts((prev) => {
      let changed = false;
      const next = prev.map((account) => {
        const branchId = SEED_SLUG_BRANCH_IDS[account.branchId] ?? account.branchId;
        if (branchId === account.branchId) return account;
        changed = true;
        return { ...account, branchId };
      });
      return changed ? next : prev;
    });
  }, [accounts, currentUser, empresaId, realBranches, setAccounts, tenantError, tenantLoading]);

  useEffect(() => {
    if (!currentUser || tenantLoading || tenantError || !empresaId) return;
    if (realBranches.length === 0) return;
    remapCashBranches(SEED_SLUG_BRANCH_IDS);
  }, [cashShifts, currentUser, empresaId, movementsByBranch, realBranches, remapCashBranches, tenantError, tenantLoading]);

  useEffect(() => {
    if (!currentUser || tenantLoading || tenantError || !empresaId) return;
    if (realBranches.length === 0) return;
    remapOrdersBranches(SEED_SLUG_BRANCH_IDS);
  }, [currentUser, empresaId, ordersByBranch, realBranches, remapOrdersBranches, tenantError, tenantLoading]);

  useEffect(() => {
    if (!currentUser || tenantLoading || tenantError || !empresaId) return;
    if (realBranches.length === 0) return;
    remapTablesBranches(SEED_SLUG_BRANCH_IDS);
  }, [currentUser, empresaId, realBranches, remapTablesBranches, tablesByBranch, tenantError, tenantLoading]);

  /* Poda de combos huérfanos cuando cambia el catálogo. */
  const prunedCombos = useRef<{ key: string; version: number } | null>(null);
  useEffect(() => {
    if (!currentUser || catalogVersion === 0) return;
    if (
      prunedCombos.current?.key === tenantKey &&
      prunedCombos.current.version === catalogVersion
    ) {
      return;
    }
    prunedCombos.current = { key: tenantKey, version: catalogVersion };
    const ids = new Set(products.map((product) => product.id));
    const pruned = combos.filter((combo) =>
      combo.productIds.every((productId) => ids.has(productId)),
    );
    if (pruned.length !== combos.length) setCombos(pruned);
  }, [combos, currentUser, catalogVersion, products, setCombos, tenantKey]);

  /* ---------- Comandas reales (AYCDS-25) ---------- */

  const [liveOrders, setLiveOrders] = useState<Order[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const ordersRequest = useRef(0);

  const platoNames = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  );
  const platoNameOf = useCallback(
    (platoId: string | null, tipo: string): string =>
      (platoId ? platoNames.get(platoId) : undefined) ?? (tipo === 'COMBO' ? 'Combo' : 'Plato'),
    [platoNames],
  );

  const refreshOrders = useCallback(
    async (signal?: AbortSignal) => {
      if (!currentUser?.empresaId) {
        setLiveOrders(null);
        return;
      }
      const requestId = ++ordersRequest.current;
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const list = await ordersApi.listOrders({
          sucursalId: activeBranchId !== GENERAL_BRANCH.id ? activeBranchId : undefined,
          limit: 100,
          signal,
        });
        if (requestId !== ordersRequest.current) return;
        setLiveOrders(list.items.map((order) => orderFromApi(order, { nameOf: platoNameOf })));
        setAccounts((prev) => reconcileAccounts(prev, list.items, platoNameOf));
      } catch (error) {
        if (requestId !== ordersRequest.current || signal?.aborted) return;
        setOrdersError(
          error instanceof ApiError ? error.message : 'No se pudieron cargar las comandas.',
        );
      } finally {
        if (requestId === ordersRequest.current) setOrdersLoading(false);
      }
    },
    [activeBranchId, currentUser, platoNameOf, setAccounts],
  );

  useEffect(() => {
    if (!currentUser?.empresaId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpiar comandas al cerrar sesión
      setLiveOrders(null);
      setOrdersError(null);
      return;
    }
    const controller = new AbortController();
    void refreshOrders(controller.signal);
    return () => controller.abort();
  }, [currentUser, refreshOrders]);

  useEffect(() => {
    if (!currentUser?.empresaId) return;
    return connectOrdersRealtime({
      onOrderCreated: () => {
        void refreshOrders();
      },
      onOrderUpdated: () => {
        void refreshOrders();
      },
      onTableStatus: () => {
        void refreshOrders();
      },
    });
  }, [currentUser?.empresaId, refreshOrders]);

  /* ---------- Mesas y reservas reales (AYCDS-26) ---------- */

  const [liveTables, setLiveTables] = useState<Table[] | null>(null);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const tablesRequest = useRef(0);
  const tablesRef = useRef<Table[]>([]);

  const refreshTables = useCallback(
    async (signal?: AbortSignal) => {
      if (!currentUser?.empresaId) {
        tablesRef.current = [];
        setLiveTables(null);
        setTablesError(null);
        setTablesLoading(false);
        return;
      }
      const requestId = ++tablesRequest.current;
      setTablesLoading(true);
      setTablesError(null);
      try {
        const list = await listTables({
          sucursalId: activeBranchId !== GENERAL_BRANCH.id ? activeBranchId : undefined,
          signal,
        });
        if (requestId !== tablesRequest.current) return;
        const mapped = tablesFromApi(list);
        tablesRef.current = mapped;
        setLiveTables(mapped);
      } catch (error) {
        if (requestId !== tablesRequest.current || signal?.aborted) return;
        setTablesError(
          error instanceof ApiError ? error.message : 'No se pudieron cargar las mesas.',
        );
      } finally {
        if (requestId === tablesRequest.current) setTablesLoading(false);
      }
    },
    [activeBranchId, currentUser],
  );

  const [liveReservations, setLiveReservations] = useState<Reservation[] | null>(null);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationsError, setReservationsError] = useState<string | null>(null);
  const reservationsRequest = useRef(0);
  const reservationsDay = useRef(limaTodayKey());

  const refreshReservations = useCallback(
    async (fecha?: string, signal?: AbortSignal) => {
      if (!currentUser?.empresaId) {
        setLiveReservations(null);
        setReservationsError(null);
        setReservationsLoading(false);
        return;
      }
      const day = fecha ?? reservationsDay.current;
      reservationsDay.current = day;
      const requestId = ++reservationsRequest.current;
      setReservationsLoading(true);
      setReservationsError(null);
      try {
        const list = await listReservations({ fecha: day, limit: 100, signal });
        if (requestId !== reservationsRequest.current) return;
        setLiveReservations(reservationsFromApi(list.items, tablesRef.current));
      } catch (error) {
        if (requestId !== reservationsRequest.current || signal?.aborted) return;
        setReservationsError(
          error instanceof ApiError ? error.message : 'No se pudieron cargar las reservas.',
        );
      } finally {
        if (requestId === reservationsRequest.current) setReservationsLoading(false);
      }
    },
    [currentUser],
  );

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      await refreshTables(controller.signal);
      await refreshReservations(undefined, controller.signal);
    })();
    return () => controller.abort();
  }, [currentUser, refreshTables, refreshReservations]);

  const demoOrders = useMemo(() => {
    if (!isGeneral) return ordersByBranch[activeBranchId] ?? [];
    return branchIds.flatMap((id) => ordersByBranch[id] ?? []);
  }, [ordersByBranch, activeBranchId, isGeneral, branchIds]);

  const demoTables = useMemo(() => {
    if (!isGeneral) return tablesByBranch[activeBranchId] ?? [];
    return branchIds.flatMap((id) => tablesByBranch[id] ?? []);
  }, [tablesByBranch, activeBranchId, isGeneral, branchIds]);

  const setOrders = useCallback(
    (value: React.SetStateAction<Order[]>) => {
      setOrdersForBranches(branchIds, activeBranchId, value);
    },
    [activeBranchId, branchIds, setOrdersForBranches],
  );

  const setTables = useCallback(
    (value: React.SetStateAction<Table[]>) => {
      setTablesForBranches(branchIds, activeBranchId, value);
    },
    [activeBranchId, branchIds, setTablesForBranches],
  );

  const value = useMemo<LiveDataContextValue>(
    () => ({
      orders: liveOrders ?? demoOrders,
      ordersLoading,
      ordersError,
      refreshOrders,
      tables: liveTables ?? demoTables,
      tablesLoading,
      tablesError,
      refreshTables,
      reservations: liveReservations ?? demoReservations,
      reservationsLoading,
      reservationsError,
      refreshReservations,
      setOrders,
      setTables,
      setReservations: setDemoReservations,
      setOrdersError,
    }),
    [
      demoOrders,
      demoTables,
      demoReservations,
      liveOrders,
      liveReservations,
      liveTables,
      ordersError,
      ordersLoading,
      refreshOrders,
      refreshReservations,
      refreshTables,
      reservationsError,
      reservationsLoading,
      setDemoReservations,
      setOrders,
      setTables,
      tablesError,
      tablesLoading,
    ],
  );

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}

export function useLiveData(): LiveDataContextValue {
  const context = useContext(LiveDataContext);
  if (!context) throw new Error('useLiveData debe usarse dentro de LiveDataProvider');
  return context;
}
