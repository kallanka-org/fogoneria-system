'use client';

/**
 * Acciones cross-cutting del workspace.
 *
 * `WorkspaceActionsProvider` se monta **una sola vez** en `app/layout.tsx` y
 * posee los guards de orquestación (`sunatEnviados`, idempotencia y cola del
 * checkout). `useWorkspaceActions` consume ese contexto: dos consumidores
 * (topbar, caja, mozo…) comparten los mismos guards y el reset los limpia todos.
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from 'react';
import {
  fmtDateTime,
  itemLineTotal,
  newId,
  nextReceiptNumber,
  nowIso,
  round2,
  type AccountItem,
  type TableAccount,
} from '@/lib/domain';
import type { CashMovement, Order, OrderStatus, Receipt } from '@/lib/erp';
import type { Ticket } from '@/lib/dashboard';
import { ApiError } from '@/lib/api';
import * as ordersApi from '@/lib/orders-api';
import {
  UI_TO_API_STATUS,
  orderFromApi,
  orderItemsFromAccount,
} from '@/lib/order-mapping';
import { resetErpState } from '@/lib/persistence';
import { tenantKeyOf } from '@/lib/session-state';
import { useAccounts, useOrdersDemo } from '@/features/mod_orders/provider';
import { useCash } from '@/features/mod_cash/provider';
import { useCrm } from '@/features/mod_crm/provider';
import { useExpenses } from '@/features/mod_expenses/provider';
import { useInventory } from '@/features/mod_inventory/provider';
import { usePromotions } from '@/features/mod_promotions/provider';
import { useReceipts } from '@/features/mod_receipts/provider';
import { useReservations } from '@/features/mod_reservations/provider';
import { useStaff } from '@/features/mod_staff/provider';
import { useTables } from '@/features/mod_tables/provider';
import { useTickets } from './tickets';
import { useCatalogoState } from './catalog';
import { useCheckoutController } from './checkout';
import { useLiveData } from './live';
import { useNotifications } from './notifications';
import { useSession } from './session';
import { useTenant } from '@/features/mod_tenant/provider';

const TERMINAL_API_STATES: readonly ordersApi.ApiOrderStatus[] = [
  'PAGADA',
  'CERRADA',
  'ANULADA',
];

function useWorkspaceActionsValue() {
  const { currentUser } = useSession();
  const { notify } = useNotifications();
  const { branchIds, activeBranchId, isGeneral } = useTenant();
  const { accounts, setAccounts, resetAccounts } = useAccounts();
  const { setBranchOrders, resetOrdersDemo } = useOrdersDemo();
  const { patchStatus, resetTables } = useTables();
  const { startShift, closeShift, reverseMovements, resetCash } = useCash();
  const {
    receipts,
    addReceipt,
    patchReceipt,
    enviarSunat,
    resetReceipts,
  } = useReceipts();
  const { resetPromotions } = usePromotions();
  const { resetCustomers } = useCrm();
  const { resetExpenses } = useExpenses();
  const { resetInventory } = useInventory();
  const { resetRoles } = useStaff();
  const { setTickets, resetTickets } = useTickets();
  const { resetReservations } = useReservations();
  const { products, refreshCatalog } = useCatalogoState();
  const { orders, setOrders, setOrdersError, refreshOrders } = useLiveData();

  const platoNameOf = useCallback(
    (platoId: string | null, tipo: string): string =>
      (platoId ? products.find((product) => product.id === platoId)?.name : undefined) ??
      (tipo === 'COMBO' ? 'Combo' : 'Plato'),
    [products],
  );

  const tenantKey = tenantKeyOf(currentUser);
  const writeBranchId = isGeneral ? branchIds[0] : activeBranchId;
  const sunatEnviados = useRef(new Set<string>());

  /* ---------- Cuentas ---------- */

  const openAccount = useCallback(
    (input: {
      tableId: number | null;
      tableApiId?: string | null;
      label: string;
      customer: string;
      waiter: string;
    }): string | null => {
      const id = newId('CT');
      const account: TableAccount = {
        id,
        branchId: writeBranchId,
        tableId: input.tableId,
        tableApiId: input.tableApiId ?? null,
        label: input.label,
        customer: input.customer,
        waiter: input.waiter,
        openedAt: nowIso(),
        closedAt: null,
        status: 'abierta',
        items: [],
        payments: [],
        tip: 0,
        discount: 0,
        discountConcept: '',
        couponCode: null,
        customerId: null,
        motivoAnulacion: null,
      };
      setAccounts((prev) => [account, ...prev]);
      if (input.tableId) patchStatus(writeBranchId, input.tableId, 'ocupada');
      return id;
    },
    [patchStatus, setAccounts, writeBranchId],
  );

  const patchAccount = useCallback(
    (accountId: string, fn: (a: TableAccount) => TableAccount) => {
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? fn(a) : a)));
    },
    [setAccounts],
  );

  const addAccountItems = useCallback(
    (accountId: string, items: AccountItem[]) => {
      patchAccount(accountId, (a) => ({ ...a, items: [...a.items, ...items] }));
    },
    [patchAccount],
  );

  const updateAccountItem = useCallback(
    (accountId: string, itemId: string, qty: number) => {
      patchAccount(accountId, (a) => ({
        ...a,
        items:
          qty <= 0
            ? a.items.filter((i) => i.id !== itemId)
            : a.items.map((i) => (i.id === itemId ? { ...i, qty } : i)),
      }));
    },
    [patchAccount],
  );

  const removeAccountItem = useCallback(
    (accountId: string, itemId: string) => {
      patchAccount(accountId, (a) => ({ ...a, items: a.items.filter((i) => i.id !== itemId) }));
    },
    [patchAccount],
  );

  /* ---------- Comandas ---------- */

  const localSendToKitchen = useCallback(
    (accountId: string): Order | null => {
      const account = accounts.find((a) => a.id === accountId);
      const pending = account?.items.filter((i) => !i.sent) ?? [];
      if (!account || pending.length === 0) return null;
      const order: Order = {
        id: `#PD-${Date.now().toString().slice(-6)}`,
        accountId,
        tableId: account.tableId,
        customer: account.label,
        items: pending.map((i) => ({
          productId: i.productId,
          name: i.name,
          qty: i.qty,
          modifiers: i.modifiers.map((m) => m.name),
        })),
        amount: round2(pending.reduce((s, i) => s + itemLineTotal(i), 0)),
        time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        elapsed: 'ahora mismo',
        createdAt: nowIso(),
        status: 'pendiente',
        channel: account.tableId ? 'Mesa' : 'Llevar',
        waiter: account.waiter,
      };
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId
            ? { ...a, items: a.items.map((i) => (i.sent ? i : { ...i, sent: true })) }
            : a,
        ),
      );
      setBranchOrders(account.branchId, (current) => [order, ...current]);
      return order;
    },
    [accounts, setAccounts, setBranchOrders],
  );

  const createOrderFromAccount = useCallback(
    async (accountId: string): Promise<Order | null> => {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) return null;
      const items = orderItemsFromAccount(account);
      if (items.length === 0) return null;

      const created = await ordersApi.createOrder({
        ...(account.tableApiId ? { mesaId: account.tableApiId } : {}),
        origen: account.tableApiId ? 'MESA' : 'BARRA',
        items,
      });

      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId
            ? {
                ...a,
                orderApiIds: [...(a.orderApiIds ?? []), created.id],
                items: a.items.map((i) => (i.sent ? i : { ...i, sent: true })),
              }
            : a,
        ),
      );
      await refreshOrders();
      return orderFromApi(created, { nameOf: platoNameOf });
    },
    [accounts, platoNameOf, refreshOrders, setAccounts],
  );

  const sendToKitchen = useCallback(
    async (accountId: string): Promise<Order | null> => {
      if (!currentUser?.empresaId) return localSendToKitchen(accountId);
      try {
        return await createOrderFromAccount(accountId);
      } catch (error) {
        setOrdersError(
          error instanceof ApiError ? error.message : 'No se pudo enviar la comanda.',
        );
        throw error;
      }
    },
    [createOrderFromAccount, currentUser, localSendToKitchen, setOrdersError],
  );

  const advanceOrder = useCallback(
    async (order: Order, next: OrderStatus): Promise<boolean> => {
      const apiStatus = UI_TO_API_STATUS[next];
      if (order.apiId && currentUser?.empresaId) {
        if (!apiStatus) return false;
        try {
          await ordersApi.updateOrderStatus(order.apiId, apiStatus);
          await refreshOrders();
          return true;
        } catch (error) {
          setOrdersError(
            error instanceof ApiError ? error.message : 'No se pudo actualizar la comanda.',
          );
          return false;
        }
      }
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
      return true;
    },
    [currentUser, refreshOrders, setOrders, setOrdersError],
  );

  const transitionOrderToTerminal = useCallback(
    async (orderId: string, target: 'PAGADA' | 'CERRADA' | 'ANULADA') => {
      try {
        const order = await ordersApi.getOrder(orderId);
        let currentStatus = order.estado;
        if (TERMINAL_API_STATES.includes(currentStatus)) return;
        if (target === 'ANULADA') {
          if (currentStatus === 'POR_CONFIRMAR') {
            await ordersApi.updateOrderStatus(orderId, 'ANULADA');
            return;
          }
          target = 'CERRADA';
        }
        if (currentStatus === 'POR_CONFIRMAR') {
          await ordersApi.updateOrderStatus(orderId, 'EN_COCINA');
          currentStatus = 'EN_COCINA';
        }
        if (currentStatus === 'EN_COCINA') {
          await ordersApi.updateOrderStatus(orderId, 'LISTO');
          currentStatus = 'LISTO';
        }
        if (currentStatus === 'LISTO') {
          await ordersApi.updateOrderStatus(orderId, 'ENTREGADO');
          currentStatus = 'ENTREGADO';
        }
        if (currentStatus === 'ENTREGADO') {
          await ordersApi.updateOrderStatus(orderId, target);
        }
      } catch (err) {
        console.error(`Error al pasar orden ${orderId} a ${target}:`, err);
      }
    },
    [],
  );

  const closeAccountOrders = useCallback(
    async (account: TableAccount, target: 'PAGADA' | 'CERRADA' | 'ANULADA') => {
      if (!currentUser?.empresaId) return;
      const orderIdsToClose = new Set<string>(account.orderApiIds ?? []);
      if (orders.some((ord) => ord.apiId)) {
        for (const ord of orders) {
          if (!ord.apiId) continue;
          const matchesAccount =
            account.orderApiIds?.includes(ord.apiId) || ord.accountId === account.id;
          const matchesTable =
            (account.tableApiId && ord.mesaApiId === account.tableApiId) ||
            (account.tableId != null && ord.tableId === account.tableId);
          if (matchesAccount || matchesTable) orderIdsToClose.add(ord.apiId);
        }
      }
      if (account.tableApiId) {
        try {
          const list = await ordersApi.listOrders({ mesaId: account.tableApiId });
          for (const it of list.items) {
            if (!TERMINAL_API_STATES.includes(it.estado)) orderIdsToClose.add(it.id);
          }
        } catch (err) {
          console.error('Error al consultar órdenes de mesa:', err);
        }
      }
      for (const orderId of orderIdsToClose) {
        await transitionOrderToTerminal(orderId, target);
      }
      await refreshOrders();
    },
    [currentUser?.empresaId, orders, refreshOrders, transitionOrderToTerminal],
  );

  const annulAccount = useCallback(
    (accountId: string, motivo: string) => {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) return;
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId
            ? { ...a, status: 'anulada', closedAt: nowIso(), motivoAnulacion: motivo }
            : a,
        ),
      );
      if (account.tableId) patchStatus(account.branchId, account.tableId, 'libre');
      void closeAccountOrders(account, 'ANULADA');
    },
    [accounts, closeAccountOrders, patchStatus, setAccounts],
  );

  /* ---------- Cobro ---------- */

  const { checkoutAccount, resetCheckout } = useCheckoutController({
    onCommitted: (receipt, account) => {
      if (account.tableId) patchStatus(account.branchId, account.tableId, 'libre');
      if (!sunatEnviados.current.has(receipt.id)) {
        sunatEnviados.current.add(receipt.id);
        enviarSunat(receipt);
      }
      return closeAccountOrders(account, 'PAGADA');
    },
    onPostCommitFailed: (_receipt, _account, error) => {
      setOrdersError(
        error instanceof ApiError ? error.message : 'No se pudieron cerrar las comandas.',
      );
    },
  });

  const annulReceipt = useCallback(
    (id: string, motivo: string) => {
      const receipt = receipts.find((r) => r.id === id);
      if (!receipt || receipt.status === 'Anulada') return;
      const at = nowIso();
      const account = receipt.accountId
        ? accounts.find((a) => a.id === receipt.accountId)
        : undefined;
      const methods: { method: string; amount: number }[] = account?.payments.length
        ? account.payments.map((p) => ({ method: p.method, amount: p.amount }))
        : [{ method: 'Efectivo', amount: receipt.total }];
      const reverse: CashMovement[] = methods.map((m, i) => ({
        id: Date.now() + i,
        at,
        datetime: fmtDateTime(at),
        concept: `Anulación ${receipt.id}`,
        kind: 'Egreso',
        amount: m.amount,
        method: m.method,
        accountId: receipt.accountId,
      }));
      const branchId = account?.branchId ?? branchIds[0];
      const nota: Receipt | null =
        receipt.type === '01'
          ? {
              id: nextReceiptNumber(receipts, '07'),
              type: '07',
              at,
              date: fmtDateTime(at),
              customer: receipt.customer,
              docType: receipt.docType,
              docNumber: receipt.docNumber,
              subtotal: receipt.subtotal,
              igv: receipt.igv,
              total: receipt.total,
              status: 'Emitida',
              source: `Nota de crédito · ${receipt.id}`,
              accountId: receipt.accountId,
              refId: receipt.id,
              motivoAnulacion: motivo,
              estadoSunat: 'en_cola',
              intentosEnvio: 0,
            }
          : null;
      patchReceipt(id, {
        status: 'Anulada',
        motivoAnulacion: motivo,
        estadoSunat: 'anulado',
        ...(receipt.type === '03'
          ? { bajaResumenId: receipt.bajaResumenId ?? 'RC-pendiente' }
          : {}),
      });
      if (nota) addReceipt(nota);
      reverseMovements(branchId, reverse);
      if (nota) enviarSunat(nota);
    },
    [accounts, addReceipt, branchIds, enviarSunat, patchReceipt, receipts, reverseMovements],
  );

  /* ---------- Turnos ---------- */

  const startCashShift = useCallback(
    (fund: number) => {
      startShift({ branchId: writeBranchId, fund, openedBy: currentUser?.name ?? 'Caja' });
    },
    [currentUser, startShift, writeBranchId],
  );

  const closeCashShift = useCallback(
    (countedCash: number, observations: string) => {
      closeShift({
        branchId: writeBranchId,
        countedCash,
        observations,
        closedBy: currentUser?.name ?? 'Caja',
      });
    },
    [closeShift, currentUser, writeBranchId],
  );

  /* ---------- Tickets y reset ---------- */

  const addTicket = useCallback(
    (subject: string) => {
      const ticket: Ticket = {
        id: `#TK-${Math.floor(Math.random() * 9000) + 1000}`,
        subject,
        status: 'Enviado',
        updated: 'Justo ahora',
      };
      setTickets((prev) => [ticket, ...prev]);
      notify('Ticket enviado', `Tu solicitud "${subject}" ha sido enviada a soporte.`);
    },
    [notify, setTickets],
  );

  const resetDemoData = useCallback(() => {
    resetErpState(tenantKey);
    sunatEnviados.current.clear();
    resetCheckout();
    resetCustomers();
    resetExpenses();
    resetInventory();
    resetRoles();
    resetCash();
    resetReceipts();
    resetPromotions();
    resetOrdersDemo();
    resetTables();
    resetReservations();
    resetTickets();
    void refreshCatalog();
    void resetAccounts();
  }, [
    refreshCatalog,
    resetAccounts,
    resetCustomers,
    resetExpenses,
    resetInventory,
    resetOrdersDemo,
    resetPromotions,
    resetReceipts,
    resetReservations,
    resetRoles,
    resetTables,
    resetTickets,
    resetCash,
    resetCheckout,
    tenantKey,
  ]);

  return {
    openAccount,
    addAccountItems,
    updateAccountItem,
    removeAccountItem,
    sendToKitchen,
    createOrderFromAccount,
    advanceOrder,
    annulAccount,
    checkoutAccount,
    annulReceipt,
    startCashShift,
    closeCashShift,
    addTicket,
    resetDemoData,
  };
}

type WorkspaceActions = ReturnType<typeof useWorkspaceActionsValue>;

const WorkspaceActionsContext = createContext<WorkspaceActions | null>(null);

/**
 * Provider singleton de acciones y guards. Se monta una vez en el layout;
 * todos los consumidores comparten `sunatEnviados`, idempotencia y cola.
 */
export function WorkspaceActionsProvider({ children }: { children: ReactNode }) {
  const value = useWorkspaceActionsValue();
  return (
    <WorkspaceActionsContext.Provider value={value}>
      {children}
    </WorkspaceActionsContext.Provider>
  );
}

export function useWorkspaceActions(): WorkspaceActions {
  const context = useContext(WorkspaceActionsContext);
  if (!context) {
    throw new Error('useWorkspaceActions debe usarse dentro de WorkspaceActionsProvider');
  }
  return context;
}

/** Alias de compatibilidad: el checkout ya vive en el provider singleton. */
export function useCheckout() {
  const { checkoutAccount } = useWorkspaceActions();
  return { checkoutAccount };
}
