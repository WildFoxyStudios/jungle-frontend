import { api } from "./api";
import type { Cart, CartItem, Order, OrderDetail } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface AddToCartPayload {
  product_id: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

export interface CreateOrderPayload {
  shipping_address: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  contact_phone?: string;
  contact_email?: string;
  payment_method: "stripe" | "paypal" | "cash";
}

export interface UpdatePaymentPayload {
  payment_id: string;
  status: "paid" | "failed";
}

export interface OrdersQuery {
  status?: string;
  limit?: number;
  offset?: number;
}

// ─── Cart API ─────────────────────────────────────────────────────────────────

export const cartApi = {
  /**
   * GET /cart
   * Returns the authenticated user's shopping cart, creating one if it
   * doesn't exist yet.
   */
  get: (): Promise<Cart> => api.get<Cart>("/cart").then((r) => r.data),

  /**
   * POST /cart
   * Add a product to the cart (or increase its quantity if already present).
   * Returns the updated cart.
   */
  addItem: (payload: AddToCartPayload): Promise<Cart> =>
    api.post<Cart>("/cart", payload).then((r) => r.data),

  /**
   * PUT /cart/items/:id
   * Update the quantity of a specific cart line item.
   * Returns the updated cart.
   */
  updateItem: (itemId: string, payload: UpdateCartItemPayload): Promise<Cart> =>
    api.put<Cart>(`/cart/items/${itemId}`, payload).then((r) => r.data),

  /**
   * DELETE /cart/items/:id
   * Remove a single item from the cart.
   * Returns the updated cart.
   */
  removeItem: (itemId: string): Promise<Cart> =>
    api.delete<Cart>(`/cart/items/${itemId}`).then((r) => r.data),

  /**
   * DELETE /cart
   * Empty the entire cart (remove all items).
   */
  clear: (): Promise<{ success: boolean; message: string }> =>
    api
      .delete<{ success: boolean; message: string }>("/cart")
      .then((r) => r.data),
};

// ─── Orders API ───────────────────────────────────────────────────────────────

export const ordersApi = {
  /**
   * POST /orders
   * Convert the current cart into a new order.
   * The cart is emptied after a successful order is created.
   */
  create: (payload: CreateOrderPayload): Promise<Order> =>
    api.post<Order>("/orders", payload).then((r) => r.data),

  /**
   * GET /orders
   * List all orders placed by the authenticated user.
   * Optionally filter by status and paginate.
   */
  list: (params?: OrdersQuery): Promise<Order[]> =>
    api.get<Order[]>("/orders", { params }).then((r) => r.data),

  /**
   * GET /orders/:id
   * Fetch full order details, including line items, shipping address,
   * and payment status. Accessible to both the buyer and the seller.
   */
  get: (orderId: string): Promise<OrderDetail> =>
    api.get<OrderDetail>(`/orders/${orderId}`).then((r) => r.data),

  /**
   * POST /orders/:id/payment
   * Webhook / client callback to update the payment status after a
   * Stripe / PayPal confirmation. Transitions the order to "confirmed"
   * when status is "paid".
   */
  updatePayment: (
    orderId: string,
    payload: UpdatePaymentPayload,
  ): Promise<{ success: boolean }> =>
    api
      .post<{ success: boolean }>(`/orders/${orderId}/payment`, payload)
      .then((r) => r.data),
};
