"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShoppingBag,
  Eye,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Search,
  Filter,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { ordersApi } from "@/lib/api-orders";
import { useApi, useInfiniteApi } from "@/hooks/useApi";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Order, OrderDetail } from "@/lib/types";

// ─── Status config ─────────────────────────────────────────────────────────────

const ORDER_STATUS: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    badgeVariant: "default" | "primary" | "success" | "warning" | "danger";
    step: number;
  }
> = {
  pending: {
    label: "Pendiente",
    icon: <Clock size={15} />,
    color: "text-amber-600 dark:text-amber-400",
    badgeVariant: "warning",
    step: 1,
  },
  confirmed: {
    label: "Confirmado",
    icon: <CheckCircle size={15} />,
    color: "text-blue-600 dark:text-blue-400",
    badgeVariant: "primary",
    step: 2,
  },
  processing: {
    label: "En preparación",
    icon: <Package size={15} />,
    color: "text-indigo-600 dark:text-indigo-400",
    badgeVariant: "primary",
    step: 2,
  },
  shipped: {
    label: "Enviado",
    icon: <Truck size={15} />,
    color: "text-purple-600 dark:text-purple-400",
    badgeVariant: "primary",
    step: 3,
  },
  delivered: {
    label: "Entregado",
    icon: <CheckCircle size={15} />,
    color: "text-green-600 dark:text-green-400",
    badgeVariant: "success",
    step: 4,
  },
  cancelled: {
    label: "Cancelado",
    icon: <XCircle size={15} />,
    color: "text-red-600 dark:text-red-400",
    badgeVariant: "danger",
    step: 0,
  },
  refunded: {
    label: "Reembolsado",
    icon: <RefreshCw size={15} />,
    color: "text-slate-600 dark:text-slate-400",
    badgeVariant: "default",
    step: 0,
  },
};

const PAYMENT_STATUS: Record<
  string,
  {
    label: string;
    variant: "default" | "primary" | "success" | "warning" | "danger";
  }
> = {
  pending: { label: "Pago pendiente", variant: "warning" },
  paid: { label: "Pagado", variant: "success" },
  failed: { label: "Pago fallido", variant: "danger" },
  refunded: { label: "Reembolsado", variant: "default" },
};

const STATUS_STEPS = [
  { key: "confirmed", label: "Confirmado", icon: <CheckCircle size={16} /> },
  { key: "processing", label: "Preparando", icon: <Package size={16} /> },
  { key: "shipped", label: "Enviado", icon: <Truck size={16} /> },
  { key: "delivered", label: "Entregado", icon: <CheckCircle size={16} /> },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  return (
    <div className="max-w-[960px] mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Package
              size={22}
              className="text-indigo-600 dark:text-indigo-400"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
              Mis pedidos
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Gestiona y rastrea tus compras
            </p>
          </div>
        </div>
        <Link href="/marketplace">
          <Button variant="secondary" leftIcon={<ShoppingBag size={15} />}>
            <span className="hidden sm:inline">Seguir comprando</span>
            <span className="sm:hidden">Comprar</span>
          </Button>
        </Link>
      </div>

      {/* Tabs by status */}
      <Tabs
        defaultTab="all"
        onChange={(tab) => setStatusFilter(tab === "all" ? "" : tab)}
      >
        <div className="surface mb-4 overflow-x-auto no-scrollbar">
          <TabList className="px-2 min-w-max">
            <Tab value="all">Todos</Tab>
            <Tab value="pending">Pendientes</Tab>
            <Tab value="confirmed">Confirmados</Tab>
            <Tab value="shipped">Enviados</Tab>
            <Tab value="delivered">Entregados</Tab>
            <Tab value="cancelled">Cancelados</Tab>
          </TabList>
        </div>

        {/* All tabs share the same content - just filter changes */}
        {[
          "all",
          "pending",
          "confirmed",
          "shipped",
          "delivered",
          "cancelled",
        ].map((tab) => (
          <TabPanel key={tab} value={tab}>
            <OrdersList
              status={tab === "all" ? undefined : tab}
              onViewDetail={setSelectedOrder}
            />
          </TabPanel>
        ))}
      </Tabs>

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

// ─── Orders list ──────────────────────────────────────────────────────────────

function OrdersList({
  status,
  onViewDetail,
}: {
  status?: string;
  onViewDetail: (order: Order) => void;
}) {
  const {
    items: orders,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = useInfiniteApi(
    (offset, limit) => ordersApi.list({ status, limit, offset }),
    [status],
    15,
  );

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package size={36} />}
        title={
          status
            ? `Sin pedidos ${ORDER_STATUS[status]?.label.toLowerCase() ?? status}`
            : "Sin pedidos aún"
        }
        description={
          status
            ? "No tienes pedidos con este estado en este momento."
            : "Cuando realices compras en el Marketplace, aparecerán aquí."
        }
        action={
          !status ? (
            <Link href="/marketplace">
              <Button leftIcon={<ShoppingBag size={15} />}>
                Ir al Marketplace
              </Button>
            </Link>
          ) : undefined
        }
        className="py-16"
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order, i) => (
        <OrderCard
          key={order.id}
          order={order}
          index={i}
          onViewDetail={() => onViewDetail(order)}
        />
      ))}

      {loadingMore && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {!hasMore && orders.length > 0 && (
        <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
          Has visto todos tus pedidos
        </p>
      )}
    </div>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  index,
  onViewDetail,
}: {
  order: Order;
  index: number;
  onViewDetail: () => void;
}) {
  const statusCfg = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending;
  const paymentCfg =
    PAYMENT_STATUS[order.payment_status] ?? PAYMENT_STATUS.pending;

  return (
    <div
      className={cn(
        "surface p-4 hover:shadow-md transition-all duration-200 cursor-pointer group animate-fade-in-up",
        `stagger-${(index % 5) + 1}`,
      )}
      onClick={onViewDetail}
    >
      {/* Top row: order number + status + date */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Package size={15} className="text-slate-400 shrink-0" />
            <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
              #{order.order_number}
            </span>
          </div>
          <Badge variant={statusCfg.badgeVariant} size="sm">
            <span className={cn("flex items-center gap-1", statusCfg.color)}>
              {statusCfg.icon}
              {statusCfg.label}
            </span>
          </Badge>
          <Badge variant={paymentCfg.variant} size="sm">
            {paymentCfg.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 hidden sm:block">
            {format(new Date(order.created_at), "d MMM yyyy", { locale: es })}
          </span>
          <ChevronRight
            size={18}
            className="text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>
      </div>

      {/* Progress bar for active orders */}
      {statusCfg.step > 0 && statusCfg.step < 4 && (
        <div className="mb-4">
          <div className="flex items-center gap-0 relative">
            {STATUS_STEPS.map((step, i) => {
              const isCompleted = statusCfg.step > i + 1;
              const isCurrent = statusCfg.step === i + 1;
              const isLast = i === STATUS_STEPS.length - 1;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  {/* Step dot */}
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white z-10",
                      isCompleted
                        ? "bg-indigo-600"
                        : isCurrent
                          ? "bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900/50"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500",
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle size={14} />
                    ) : (
                      <span
                        className={cn(
                          "text-[10px] font-bold",
                          !isCurrent && "text-slate-400",
                        )}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>

                  {/* Step label */}
                  <div className="flex-1 flex flex-col items-center px-1">
                    {!isLast && (
                      <div
                        className={cn(
                          "h-0.5 w-full rounded-full",
                          isCompleted || isCurrent
                            ? "bg-indigo-500"
                            : "bg-slate-200 dark:bg-slate-700",
                        )}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5">
            {STATUS_STEPS.map((step, i) => {
              const isCompleted = statusCfg.step > i + 1;
              const isCurrent = statusCfg.step === i + 1;
              return (
                <span
                  key={step.key}
                  className={cn(
                    "text-[10px] font-medium text-center",
                    isCompleted || isCurrent
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 dark:text-slate-500",
                  )}
                  style={{ width: "25%" }}
                >
                  {step.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom row: total + actions */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Total</span>
          <span className="font-black text-base text-indigo-600 dark:text-indigo-400">
            ${order.total.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 sm:hidden">
            {format(new Date(order.created_at), "d MMM", { locale: es })}
          </span>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Eye size={13} />}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail();
            }}
            className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            Ver detalles
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Order detail modal ───────────────────────────────────────────────────────

function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const toast = useToast();
  const { data: detail, loading } = useApi(
    () => ordersApi.get(order.id),
    [order.id],
  );

  const statusCfg = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending;
  const paymentCfg =
    PAYMENT_STATUS[order.payment_status] ?? PAYMENT_STATUS.pending;

  const handleCopyTracking = () => {
    if (detail?.tracking_number) {
      navigator.clipboard.writeText(detail.tracking_number);
      toast.success("Número de seguimiento copiado");
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Pedido #${order.order_number}`}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-slate-100 dark:bg-gray-800 rounded-xl" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-slate-100 dark:bg-gray-800 rounded-xl"
              />
            ))}
          </div>
          <div className="h-24 bg-slate-100 dark:bg-gray-800 rounded-xl" />
        </div>
      ) : detail ? (
        <div className="space-y-6">
          {/* Status banner */}
          <div
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl",
              order.status === "delivered"
                ? "bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30"
                : order.status === "cancelled" || order.status === "refunded"
                  ? "bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30"
                  : "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30",
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                order.status === "delivered"
                  ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                  : order.status === "cancelled" || order.status === "refunded"
                    ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                    : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
              )}
            >
              {statusCfg.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-slate-50">
                {statusCfg.label}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Pedido el{" "}
                {format(new Date(order.created_at), "d 'de' MMMM 'de' yyyy", {
                  locale: es,
                })}
              </p>
              {detail.tracking_number && (
                <button
                  onClick={handleCopyTracking}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium mt-0.5 flex items-center gap-1"
                >
                  <Truck size={11} />
                  Seguimiento: {detail.tracking_number}
                </button>
              )}
            </div>
            <Badge variant={paymentCfg.variant} className="shrink-0">
              {paymentCfg.label}
            </Badge>
          </div>

          {/* Progress tracker */}
          {statusCfg.step > 0 && (
            <div className="surface p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                Estado del pedido
              </h3>
              <div className="space-y-4">
                {STATUS_STEPS.map((step, i) => {
                  const isCompleted = statusCfg.step > i + 1;
                  const isCurrent = statusCfg.step === i + 1;
                  const isPending = statusCfg.step < i + 1;

                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          isCompleted
                            ? "bg-indigo-600 text-white"
                            : isCurrent
                              ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-300 dark:ring-indigo-700"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500",
                        )}
                      >
                        {isCompleted ? <CheckCircle size={16} /> : step.icon}
                      </div>
                      <div className="flex-1 min-w-0 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            isPending
                              ? "text-slate-400 dark:text-slate-500"
                              : "text-slate-800 dark:text-slate-100",
                          )}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                            Estado actual
                          </p>
                        )}
                        {isCompleted && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            Completado
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order items */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Package size={15} />
              Artículos ({detail.items.length})
            </h3>
            <div className="space-y-2">
              {detail.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-800 rounded-xl"
                >
                  {/* Item image */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 dark:bg-gray-700 shrink-0">
                    {item.product_image_url ? (
                      <img
                        src={item.product_image_url}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={20} className="text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      ${item.unit_price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>

                  {/* Line total */}
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100 shrink-0">
                    ${item.total_price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="surface p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Truck size={14} />
                Dirección de envío
              </h3>
              <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                <p className="flex items-start gap-2">
                  <MapPin
                    size={14}
                    className="text-slate-400 shrink-0 mt-0.5"
                  />
                  <span>{detail.shipping_address}</span>
                </p>
              </div>
            </div>

            <div className="surface p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <CreditCard size={14} />
                Información de pago
              </h3>
              <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Método</span>
                  <span className="font-medium capitalize">
                    {detail.payment_method ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estado</span>
                  <Badge variant={paymentCfg.variant} size="sm">
                    {paymentCfg.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Price summary */}
          <div className="surface p-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              Resumen del pago
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal</span>
                <span>${detail.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Envío</span>
                <span
                  className={
                    detail.shipping_cost === 0
                      ? "text-green-600 dark:text-green-400 font-medium"
                      : ""
                  }
                >
                  {detail.shipping_cost === 0
                    ? "Gratis"
                    : `$${detail.shipping_cost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>IVA</span>
                <span>${detail.tax.toFixed(2)}</span>
              </div>
              <hr className="border-slate-200 dark:border-slate-700" />
              <div className="flex justify-between text-base font-black text-slate-900 dark:text-slate-50">
                <span>Total</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  ${detail.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions for non-completed orders */}
          {order.status === "pending" && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <AlertCircle
                size={18}
                className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Pago pendiente
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Tu pedido está esperando confirmación de pago. Si ya pagaste,
                  espera unos minutos para que se actualice.
                </p>
              </div>
            </div>
          )}

          {order.status === "shipped" && detail.tracking_number && (
            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
              <div className="flex items-center gap-3">
                <Truck
                  size={18}
                  className="text-purple-600 dark:text-purple-400 shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                    Tu pedido está en camino
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                    Número de seguimiento: {detail.tracking_number}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopyTracking}
              >
                Copiar
              </Button>
            </div>
          )}

          {order.status === "delivered" && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
              <CheckCircle
                size={18}
                className="text-green-600 dark:text-green-400 shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  ¡Pedido entregado!
                </p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                  Tu pedido fue entregado exitosamente. Si tienes algún
                  problema, contacta al vendedor.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Package size={32} />}
          title="Error al cargar el pedido"
          description="No se pudo cargar la información de este pedido."
          action={
            <Button variant="secondary" leftIcon={<RefreshCw size={15} />}>
              Reintentar
            </Button>
          }
        />
      )}
    </Modal>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OrderCardSkeleton() {
  return (
    <div className="surface p-4 space-y-3">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-20" />
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center flex-1">
              <Skeleton className="w-7 h-7 rounded-full shrink-0" />
              {i < 3 && <Skeleton className="flex-1 h-0.5 mx-1" />}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-2.5 w-12" />
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}
