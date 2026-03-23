import { api } from "./api";
import type { Cart } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface AddToCartPayload {
  product_id: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

// ─── Cart API ─────────────────────────────────────────────────────────────────

export const cartApi = {
  /**
   * GET /cart
   * Returns the current user's cart, creating one if it doesn't exist yet.
   * The response includes all items with their current prices and a subtotal.
   */
  getCart: (): Promise<Cart> => api.get<Cart>("/cart").then((r) => r.data),

  /**
   * POST /cart
   * Adds a product to the cart (or increments its quantity if already present).
   * Returns the updated cart.
   */
  addItem: (payload: AddToCartPayload): Promise<Cart> =>
    api.post<Cart>("/cart", payload).then((r) => r.data),

  /**
   * PUT /cart/items/:id
   * Updates the quantity of a specific cart item.
   * Quantity must be ≥ 1. Returns the updated cart.
   */
  updateItem: (itemId: string, payload: UpdateCartItemPayload): Promise<Cart> =>
    api.put<Cart>(`/cart/items/${itemId}`, payload).then((r) => r.data),

  /**
   * DELETE /cart/items/:id
   * Removes a single item from the cart. Returns the updated cart.
   */
  removeItem: (itemId: string): Promise<Cart> =>
    api.delete<Cart>(`/cart/items/${itemId}`).then((r) => r.data),

  /**
   * DELETE /cart
   * Empties the entire cart. Returns a success confirmation.
   */
  clearCart: (): Promise<{ success: boolean; message: string }> =>
    api
      .delete<{ success: boolean; message: string }>("/cart")
      .then((r) => r.data),
};
