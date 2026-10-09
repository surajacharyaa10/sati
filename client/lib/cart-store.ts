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

const storageKey = "sati-cart"
const changeEvent = "sati:cart-change"
const emptyCart: CartItem[] = []
let cachedValue: string | null | undefined
let cachedCart = emptyCart

// Server-synced state. `null` means "no authenticated user" or "sync not yet
// run"; in that case we fall back to the local copy in localStorage.
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

export function getLocalSnapshot(): CartItem[] {
  const storedValue = window.localStorage.getItem(storageKey)
  if (storedValue === cachedValue) return cachedCart

  cachedValue = storedValue
  try {
    cachedCart = normalizeCart(storedValue ? JSON.parse(storedValue) : [])
  } catch {
    cachedCart = emptyCart
  }
  return cachedCart
}

export function getServerSnapshot() {
  return emptyCart
}

export function getSnapshot() {
  if (currentUserId && serverState !== null) return serverState
  return getLocalSnapshot()
}

export function subscribeToCart(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(changeEvent, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(changeEvent, onChange)
  }
}

function persistLocal(items: CartItem[]) {
  cachedCart = items
  cachedValue = JSON.stringify(items)
  window.localStorage.setItem(storageKey, cachedValue)
}

function notify() {
  window.dispatchEvent(new Event(changeEvent))
}

async function syncWithServer(userId: string) {
  if (syncInProgress) return
  syncInProgress = true
  try {
    // Merge the guest's local cart with the server's so nothing is lost when
    // they sign in on a different device. Existing lines for the same
    // product + size + color are combined; the server wins on quantity.
    const local = getLocalSnapshot()
    const server = await cartApi.list()
    const merged = server.slice()
    const byKey = new Map(merged.map((item) => [`${item.id}|${item.size ?? ""}|${item.color ?? ""}`, item]))
    for (const localItem of local) {
      const key = `${localItem.id}|${localItem.size ?? ""}|${localItem.color ?? ""}`
      const existing = byKey.get(key)
      if (existing) {
        existing.quantity = Math.min(existing.quantity + localItem.quantity, 99)
      } else {
        const copy = { ...localItem }
        merged.push(copy)
        byKey.set(key, copy)
      }
    }
    const saved = await cartApi.replace(merged)
    serverState = saved
    currentUserId = userId
    persistLocal(saved)
    notify()
  } catch {
    // Fall back to the local copy if the request fails.
    serverState = getLocalSnapshot()
    currentUserId = userId
  } finally {
    syncInProgress = false
  }
}

function clearServerState() {
  serverState = null
  currentUserId = null
}

export function addCartItem(item: Omit<CartItem, "quantity">) {
  if (currentUserId && serverState !== null) {
    cartApi
      .add(item.id, 1, item.size, item.color)
      .then((cart) => {
        serverState = cart
        persistLocal(cart)
        notify()
      })
      .catch(() => {})
    return
  }

  const current = getLocalSnapshot()
  const existing = current.find((cartItem) => cartItem.id === item.id)
  persistLocal(existing
    ? current.map((cartItem) => cartItem.id === item.id
      ? { ...cartItem, quantity: Math.min(cartItem.quantity + 1, 99) }
      : cartItem)
    : [...current, { ...item, quantity: 1 }])
  notify()
}

export function setCartItemQuantity(id: string, quantity: number) {
  if (currentUserId && serverState !== null) {
    cartApi
      .update(id, quantity)
      .then((cart) => {
        serverState = cart
        persistLocal(cart)
        notify()
      })
      .catch(() => {})
    return
  }

  if (quantity < 1) {
    removeCartItem(id)
    return
  }
  persistLocal(getLocalSnapshot().map((item) => item.id === id
    ? { ...item, quantity: Math.min(Math.trunc(quantity), 99) }
    : item))
  notify()
}

export function removeCartItem(id: string) {
  if (currentUserId && serverState !== null) {
    cartApi
      .remove(id)
      .then((cart) => {
        serverState = cart
        persistLocal(cart)
        notify()
      })
      .catch(() => {})
    return
  }

  persistLocal(getLocalSnapshot().filter((item) => item.id !== id))
  notify()
}

export function clearCart() {
  if (currentUserId && serverState !== null) {
    cartApi
      .clear()
      .then((cart) => {
        serverState = cart
        persistLocal(cart)
        notify()
      })
      .catch(() => {})
    return
  }

  persistLocal([])
  notify()
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