"use client"

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react"
import {
  addCartItem,
  clearCart,
  getCartSnapshot,
  getServerCartSnapshot,
  removeCartItem,
  setCartItemQuantity,
  subscribeToCart,
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
  const items = useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerCartSnapshot)
  const hasLoaded = useSyncExternalStore(subscribeToCart, () => true, () => false)
  const addItem = addCartItem
  const setQuantity = setCartItemQuantity
  const removeItem = removeCartItem

  const itemCount = items.reduce((total, item) => total + item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, itemCount, hasLoaded, addItem, setQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used inside CartProvider")
  return context
}
