"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Package,
  CreditCard,
  Tag,
  ChevronRight,
  CheckCircle,
  Truck,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { cartApi } from "@/lib/api-cart";
import { ordersApi } from "@/lib/api-orders";
import { useApi, useMutation } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Cart, CartItem } from "@/lib/types";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const toast = useToast();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const { data: cart, loading, refresh } = useApi(() => cartApi.getCart(), []);

  const { execute: updateItem } = useMutation(
    ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateItem(itemId, { quantity }),
  );

  const { execute: removeItem } = useMutation((itemId: string) =>
    cartApi.removeItem(itemId),
  );

  const { execute: clearCart } = useMutation(() => cartApi.clearCart());

  const handleUpdateQuantity = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      await handleRemoveItem(item);
      return;
    }
    try {
      await updateItem({ itemId: item.id, quantity: newQty });
      refresh();
    } catch {
      toast.error("Error al actualizar la cantidad");
    }
  };

  const handleRemoveItem = async (item: CartItem) => {
    try {
      await removeItem(item.id);
      refresh();
      toast.info(`"${item.product_name}" eliminado del carrito`);
    } catch {
      toast.error("Error al eliminar el artículo");
    }
  };

  const handleClearCart = async () => {
    if (!confirm("¿Vaciar el carrito? Esta acción no se puede deshacer."))
      return;
    try {
      await clearCart();
      refresh();
      toast.info("Carrito vaciado");
    } catch {
      toast.error("Error al vaciar el carrito");
    }
  };

  const handleOrderCreated = (orderId: string) => {
    setCheckoutOpen(false);
    setOrderSuccess(orderId);
    refresh();
  };

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-11 h-11 rounded-2xl" />
          <Skeleton className="h-7 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CartItemSkeleton key={i} />
            ))}
          </div>
          <div className="surface p-5 space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-11 w-full mt-4" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Order success ──────────────────────────────────────────────────────────

  if (orderSuccess) {
    return (
      <div className="max-w-[560px] mx-auto px-4 py-16 text-center">
        <div className="animate-fade-in-scale">
          <div className="w-24 h-24 rounded-3xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle
              size={44}
              className="text-green-600 dark:text-green-400"
            />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 mb-3">
            ¡Pedido confirmado!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            Tu pedido ha sido procesado exitosamente.
          </p>
          <p className="text-sm font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl inline-block mb-8">
            Pedido #{orderSuccess.slice(0, 8).toUpperCase()}
          </p>

          <div className="surface p-5 mb-6 text-left space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <CheckCircle size={16} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  Pedido recibido
                </p>
                <p className="text-xs text-slate-400">
                  Confirmación enviada a tu correo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <Package size={16} className="text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  En preparación
                </p>
                <p className="text-xs text-slate-400">
                  El vendedor está preparando tu pedido
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400 dark:text-slate-500">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Truck size={16} />
              </div>
              <div>
                <p className="font-semibold">En camino</p>
                <p className="text-xs">Próximamente</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/orders" className="flex-1">
              <Button
                variant="secondary"
                className="w-full"
                leftIcon={<Package size={15} />}
              >
                Ver mis pedidos
              </Button>
            </Link>
            <Link href="/marketplace" className="flex-1">
              <Button className="w-full" leftIcon={<ShoppingBag size={15} />}>
                Seguir comprando
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;

  // ─── Empty cart ─────────────────────────────────────────────────────────────

  if (isEmpty) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-6 pb-24">
        <CartHeader itemCount={0} onClear={handleClearCart} showClear={false} />
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title="Tu carrito está vacío"
          description="Agrega productos del Marketplace para verlos aquí."
          action={
            <Link href="/marketplace">
              <Button leftIcon={<ShoppingBag size={16} />} size="lg" rounded>
                Ir al Marketplace
              </Button>
            </Link>
          }
          className="py-24"
        />
      </div>
    );
  }

  // ─── Subtotal calculations ──────────────────────────────────────────────────

  const subtotal = cart?.subtotal ?? 0;
  const shippingCost = subtotal > 500 ? 0 : 99;
  const tax = subtotal * 0.16;
  const total = subtotal + shippingCost + tax;
  const freeShippingThreshold = 500;
  const progressToFreeShipping = Math.min(
    100,
    (subtotal / freeShippingThreshold) * 100,
  );

  return (
    <div className="max-w-[960px] mx-auto px-4 py-6 pb-24">
      <CartHeader
        itemCount={items.length}
        onClear={handleClearCart}
        showClear={items.length > 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Items ───────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item, i) => (
            <CartItemRow
              key={item.id}
              item={item}
              index={i}
              onUpdateQuantity={(delta) => handleUpdateQuantity(item, delta)}
              onRemove={() => handleRemoveItem(item)}
            />
          ))}
        </div>

        {/* ── Summary sidebar ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Free shipping progress */}
          {shippingCost > 0 && (
            <div className="surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={16} className="text-indigo-500 shrink-0" />
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {subtotal >= freeShippingThreshold
                    ? "¡Envío gratis!"
                    : `Faltan $${(freeShippingThreshold - subtotal).toFixed(0)} para envío gratis`}
                </p>
              </div>
              <Progress
                value={progressToFreeShipping}
                color={progressToFreeShipping >= 100 ? "success" : "primary"}
                size="sm"
              />
            </div>
          )}

          {/* Order summary */}
          <div className="surface p-5">
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-50 mb-4">
              Resumen del pedido
            </h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal ({cart?.total_items ?? 0} artículos)</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Truck size={14} />
                  Envío
                </span>
                <span
                  className={cn(
                    "font-medium",
                    shippingCost === 0 && "text-green-600 dark:text-green-400",
                  )}
                >
                  {shippingCost === 0
                    ? "Gratis"
                    : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>IVA (16%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <hr className="border-slate-200 dark:border-slate-700" />
              <div className="flex items-center justify-between text-base font-black text-slate-900 dark:text-slate-50">
                <span>Total</span>
                <span className="text-indigo-600 dark:text-indigo-400 text-lg">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Coupon field */}
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Tag
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Código de descuento"
                  className="w-full pl-8 pr-3 py-2 text-sm input-base"
                />
              </div>
              <Button variant="secondary" size="sm">
                Aplicar
              </Button>
            </div>

            {/* Checkout button */}
            <Button
              className="w-full mt-4"
              size="lg"
              rounded
              rightIcon={<ArrowRight size={18} />}
              onClick={() => setCheckoutOpen(true)}
            >
              Proceder al pago
            </Button>

            {/* Payment icons */}
            <div className="flex items-center justify-center gap-3 mt-4">
              {["💳", "🏧", "💰"].map((icon, i) => (
                <span
                  key={i}
                  className="text-xl opacity-60 hover:opacity-100 transition-opacity"
                  title={["Tarjeta", "Débito", "Efectivo"][i]}
                >
                  {icon}
                </span>
              ))}
              <span className="text-xs text-slate-400 ml-1">Pago seguro</span>
            </div>
          </div>

          {/* Security badges */}
          <div className="surface p-4 space-y-2">
            {[
              { icon: "🔒", text: "Compra 100% segura" },
              { icon: "↩️", text: "Devolución fácil en 30 días" },
              { icon: "📦", text: "Seguimiento de tu pedido" },
            ].map(({ icon, text }, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300"
              >
                <span className="text-base">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart!}
        total={total}
        shippingCost={shippingCost}
        tax={tax}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
}

// ─── Cart header ──────────────────────────────────────────────────────────────

function CartHeader({
  itemCount,
  onClear,
  showClear,
}: {
  itemCount: number;
  onClear: () => void;
  showClear: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <ShoppingCart
            size={22}
            className="text-indigo-600 dark:text-indigo-400"
          />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
            Carrito
          </h1>
          {itemCount > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {itemCount} artículo{itemCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
      {showClear && (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 size={14} />}
          onClick={onClear}
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Vaciar carrito
        </Button>
      )}
    </div>
  );
}

// ─── Cart item row ────────────────────────────────────────────────────────────

function CartItemRow({
  item,
  index,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  index: number;
  onUpdateQuantity: (delta: number) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "surface p-4 flex gap-4 animate-fade-in-up",
        `stagger-${(index % 5) + 1}`,
      )}
    >
      {/* Product image */}
      <Link
        href={`/marketplace/${item.product_id}`}
        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-gray-800 shrink-0"
      >
        {item.product_image_url ? (
          <img
            src={item.product_image_url}
            alt={item.product_name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag
              size={28}
              className="text-slate-300 dark:text-slate-600"
            />
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <Link href={`/marketplace/${item.product_id}`}>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2">
              {item.product_name}
            </h3>
          </Link>
          <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-1">
            ${item.price.toFixed(2)}{" "}
            <span className="text-xs font-normal text-slate-400">c/u</span>
          </p>
        </div>

        {/* Quantity + remove */}
        <div className="flex items-center justify-between mt-2">
          {/* Quantity control */}
          <div className="flex items-center gap-0 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => onUpdateQuantity(-1)}
              className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Reducir cantidad"
            >
              <Minus size={14} />
            </button>
            <span className="px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 min-w-[2.5rem] text-center border-x border-slate-200 dark:border-slate-700">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(1)}
              className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Aumentar cantidad"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Line total */}
            <p className="font-black text-slate-900 dark:text-slate-50 text-sm">
              ${item.total.toFixed(2)}
            </p>

            {/* Remove button */}
            <button
              onClick={onRemove}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Eliminar del carrito"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout modal ───────────────────────────────────────────────────────────

function CheckoutModal({
  open,
  onClose,
  cart,
  total,
  shippingCost,
  tax,
  onOrderCreated,
}: {
  open: boolean;
  onClose: () => void;
  cart: Cart;
  total: number;
  shippingCost: number;
  tax: number;
  onOrderCreated: (orderId: string) => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "stripe" | "paypal" | "cash"
  >("stripe");
  const [form, setForm] = useState({
    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    contact_phone: "",
    contact_email: "",
  });

  const set = <K extends keyof typeof form>(key: K, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const isValid =
    form.shipping_address.trim() &&
    form.shipping_city.trim() &&
    form.contact_phone.trim();

  const handleOrder = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const order = await ordersApi.create({
        shipping_address: form.shipping_address.trim(),
        shipping_city: form.shipping_city.trim() || undefined,
        shipping_state: form.shipping_state.trim() || undefined,
        shipping_postal_code: form.shipping_postal_code.trim() || undefined,
        contact_phone: form.contact_phone.trim() || undefined,
        contact_email: form.contact_email.trim() || undefined,
        payment_method: paymentMethod,
      });
      onOrderCreated(order.id);
    } catch {
      toast.error("Error al procesar el pedido. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const PAYMENT_METHODS = [
    {
      value: "stripe" as const,
      label: "Tarjeta de crédito / débito",
      icon: "💳",
      desc: "Visa, Mastercard, Amex",
    },
    {
      value: "paypal" as const,
      label: "PayPal",
      icon: "🅿️",
      desc: "Paga con tu cuenta PayPal",
    },
    {
      value: "cash" as const,
      label: "Efectivo / Transferencia",
      icon: "💵",
      desc: "Paga al recibir o por transferencia",
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Finalizar compra"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Volver al carrito
          </Button>
          <Button
            onClick={handleOrder}
            loading={saving}
            disabled={!isValid}
            size="lg"
            leftIcon={<CreditCard size={16} />}
          >
            Confirmar pedido · ${total.toFixed(2)}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Order summary (compact) */}
        <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <ShoppingCart size={15} />
            Resumen ({cart.total_items} artículos)
          </h3>
          <div className="space-y-2 max-h-[140px] overflow-y-auto">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-slate-700 dark:text-slate-200 flex-1 truncate pr-2">
                  {item.product_name}{" "}
                  <span className="text-slate-400">×{item.quantity}</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 shrink-0">
                  ${item.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <hr className="border-slate-200 dark:border-slate-700 my-3" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Subtotal</span>
              <span>${cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Envío</span>
              <span
                className={
                  shippingCost === 0 ? "text-green-600 dark:text-green-400" : ""
                }
              >
                {shippingCost === 0 ? "Gratis" : `$${shippingCost.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>IVA (16%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-base text-slate-900 dark:text-slate-50 pt-1">
              <span>Total</span>
              <span className="text-indigo-600 dark:text-indigo-400">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Truck size={15} />
            Dirección de envío
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Dirección <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                className="input-base pl-9"
                placeholder="Calle, número, colonia..."
                value={form.shipping_address}
                onChange={(e) => set("shipping_address", e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input-base"
                placeholder="Ciudad de México"
                value={form.shipping_city}
                onChange={(e) => set("shipping_city", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Estado
              </label>
              <input
                type="text"
                className="input-base"
                placeholder="CDMX"
                value={form.shipping_state}
                onChange={(e) => set("shipping_state", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Código postal
              </label>
              <input
                type="text"
                className="input-base"
                placeholder="06600"
                value={form.shipping_postal_code}
                onChange={(e) => set("shipping_postal_code", e.target.value)}
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Phone size={15} />
            Datos de contacto
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="tel"
                  className="input-base pl-9"
                  placeholder="+52 55 1234 5678"
                  value={form.contact_phone}
                  onChange={(e) => set("contact_phone", e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="email"
                  className="input-base pl-9"
                  placeholder="tu@correo.com"
                  value={form.contact_email}
                  onChange={(e) => set("contact_email", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <CreditCard size={15} />
            Método de pago
          </h3>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                  paymentMethod === method.value
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700",
                )}
              >
                <span className="text-2xl shrink-0">{method.icon}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-semibold text-sm",
                      paymentMethod === method.value
                        ? "text-indigo-700 dark:text-indigo-300"
                        : "text-slate-800 dark:text-slate-100",
                    )}
                  >
                    {method.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {method.desc}
                  </p>
                </div>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    paymentMethod === method.value
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-slate-300 dark:border-slate-600",
                  )}
                >
                  {paymentMethod === method.value && (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Security notice */}
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
          <span className="text-lg shrink-0">🔒</span>
          <p className="text-sm text-green-700 dark:text-green-300">
            Tus datos están protegidos con cifrado SSL de 256 bits. Nunca
            almacenamos información de tu tarjeta.
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CartItemSkeleton() {
  return (
    <div className="surface p-4 flex gap-4">
      <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-4 w-20 mt-1" />
        <div className="flex items-center justify-between mt-3">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
