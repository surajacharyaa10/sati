"use client"

import { createContext, useContext, type ReactNode } from "react"
import {
  addCartItem,
  clearCart,
  removeCartItem,
  setCartItemQuantity,
  useCartSync,
  type CartItem,
} from "@/lib/cart-store"

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  hasLoaded: boolean
  addItem: (item: Omit<CartItem, "quantity">) => void
  setQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  // Triggers the sync effect: merges the guest's local cart into the DB and
  // switches the store to server-backed mode once the user is authenticated.
  const { items, itemCount, hasLoaded } = useCartSync()

  return (
    <CartContext.Provider value={{ items, itemCount, hasLoaded, addItem: addCartItem, setQuantity: setCartItemQuantity, removeItem: removeCartItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used inside CartProvider")
  return context
}
