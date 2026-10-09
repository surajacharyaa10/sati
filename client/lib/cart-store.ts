"use client"

import { useEffect, useState } from "react"
import { useSyncExternalStore } from "react"
import { useAuth } from "@/app/components/auth-provider"
import { cartApi } from "@/lib/api"

export type CartItem = {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  alt: string
  size?: string
  color?: string
  quantity: number
}

const changeEvent = "sati:cart-change"
const authChangeEvent = "sati:auth-change"
const emptyCart: CartItem[] = []

// Server-synced state. `null` means "no authenticated user" or "sync not yet
// run"; in that case the cart is empty. There is no localStorage fallback —
// cart and wishlist only exist for signed-in users.
let serverState: CartItem[] | null = null
let currentUserId: string | null = null
let syncInProgress = false

function normalizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return emptyCart

  return value.filter((item): item is CartItem =>
    typeof item?.id === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" && Number.isFinite(item.price) &&
    typeof item.image === "string" &&
    typeof item.alt === "string" &&
    (item.size === undefined || typeof item.size === "string") &&
    (item.color === undefined || typeof item.color === "string") &&
    Number.isInteger(item.quantity) && item.quantity > 0,
  )
}

export function getServerSnapshot() {
  return emptyCart
}

export function getSnapshot() {
  if (currentUserId && serverState !== null) return serverState
  return emptyCart
}

export function subscribeToCart(onChange: () => void) {
  window.addEventListener(changeEvent, onChange)
  window.addEventListener(authChangeEvent, onChange)
  return () => {
    window.removeEventListener(changeEvent, onChange)
    window.removeEventListener(authChangeEvent, onChange)
  }
}

function notify() {
  window.dispatchEvent(new Event(changeEvent))
}

async function syncWithServer(userId: string) {
  if (syncInProgress) return
  syncInProgress = true
  try {
    const server = await cartApi.list()
    serverState = server
    currentUserId = userId
    notify()
  } catch {
    // Fall back to an empty cart if the request fails.
    serverState = emptyCart
    currentUserId = userId
  } finally {
    syncInProgress = false
  }
}

function clearServerState() {
  serverState = null
  currentUserId = null
  // The effect runs after render, so without this the first render after a
  // sign-out would still read the previous user's cart. Notify forces the
  // store to re-render with the now-empty snapshot immediately.
  notify()
}

export function addCartItem(item: Omit<CartItem, "quantity">) {
  if (currentUserId && serverState !== null) {
    cartApi
      .add(item.id, 1, item.size, item.color)
      .then((cart) => {
        serverState = cart
        notify()
      })
      .catch(() => {})
    return
  }
}

export function setCartItemQuantity(id: string, quantity: number) {
  if (currentUserId && serverState !== null) {
    cartApi
      .update(id, quantity)
      .then((cart) => {
        serverState = cart
        notify()
      })
      .catch(() => {})
    return
  }
}

export function removeCartItem(id: string) {
  if (currentUserId && serverState !== null) {
    cartApi
      .remove(id)
      .then((cart) => {
        serverState = cart
        notify()
      })
      .catch(() => {})
    return
  }
}

export function clearCart() {
  if (currentUserId && serverState !== null) {
    cartApi
      .clear()
      .then((cart) => {
        serverState = cart
        notify()
      })
      .catch(() => {})
    return
  }
}

export function useCartSync() {
  const { user, hasCheckedSession } = useAuth()
  const userId = user?.id ?? null
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (!hasCheckedSession) return
    if (userId && (currentUserId !== userId || serverState === null)) {
      setSynced(false)
      syncWithServer(userId).finally(() => setSynced(true))
    } else if (!userId && currentUserId) {
      clearServerState()
      setSynced(true)
    }
  }, [hasCheckedSession, userId])

  const items = useSyncExternalStore(
    subscribeToCart,
    getSnapshot,
    getServerSnapshot,
  )
  const hasLoaded = hasCheckedSession && (!userId || synced)
  const itemCount = items.reduce((total, item) => total + item.quantity, 0)

  return { items, itemCount, hasLoaded, addItem: addCartItem, setQuantity: setCartItemQuantity, removeItem: removeCartItem, clearCart }
}