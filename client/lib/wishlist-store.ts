"use client"

import { useEffect, useState } from "react"
import { useSyncExternalStore } from "react"
import { useAuth } from "@/app/components/auth-provider"
import { wishlistApi } from "@/lib/api"

const storageKey = "sati-wishlist"
const changeEvent = "sati:wishlist-change"
const emptyWishlist: string[] = []
let cachedValue: string | null | undefined
let cachedWishlist = emptyWishlist

// Server-synced state. `null` means "no authenticated user" or "sync not yet
// run"; in that case we fall back to the local copy in localStorage.
let serverState: string[] | null = null
let currentUserId: string | null = null
let syncInProgress = false

function normalizeWishlist(value: unknown) {
  if (!Array.isArray(value)) return emptyWishlist
  return [...new Set(value.filter((id): id is string => typeof id === "string"))]
}

function getLocalSnapshot() {
  const storedValue = window.localStorage.getItem(storageKey)
  if (storedValue === cachedValue) return cachedWishlist

  cachedValue = storedValue
  try {
    cachedWishlist = normalizeWishlist(storedValue ? JSON.parse(storedValue) : [])
  } catch {
    cachedWishlist = emptyWishlist
  }
  return cachedWishlist
}

function getServerSnapshot() {
  return emptyWishlist
}

function getSnapshot() {
  if (currentUserId && serverState !== null) return serverState
  return getLocalSnapshot()
}

function subscribeToWishlist(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(changeEvent, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(changeEvent, onChange)
  }
}

function persistLocal(productIds: string[]) {
  cachedWishlist = productIds
  cachedValue = JSON.stringify(productIds)
  window.localStorage.setItem(storageKey, cachedValue)
}

function notify() {
  window.dispatchEvent(new Event(changeEvent))
}

async function syncWithServer(userId: string) {
  if (syncInProgress) return
  syncInProgress = true
  try {
    // Merge the guest's local picks with whatever the server already has so
    // nothing is lost when they sign in on a different device.
    const local = getLocalSnapshot()
    const server = await wishlistApi.list()
    const merged = [...new Set([...server, ...local])]
    const saved = await wishlistApi.replace(merged)
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

export function toggleWishlistItem(productId: string) {
  if (currentUserId && serverState !== null) {
    wishlistApi
      .toggle(productId)
      .then(({ productIds }) => {
        serverState = productIds
        persistLocal(productIds)
        notify()
      })
      .catch(() => {})
    return
  }

  const current = getLocalSnapshot()
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId]

  cachedWishlist = next
  cachedValue = JSON.stringify(next)
  window.localStorage.setItem(storageKey, cachedValue)
  notify()
}

export function removeWishlistItem(productId: string) {
  if (currentUserId && serverState !== null) {
    wishlistApi
      .remove(productId)
      .then((productIds) => {
        serverState = productIds
        persistLocal(productIds)
        notify()
      })
      .catch(() => {})
    return
  }

  const next = getLocalSnapshot().filter((id) => id !== productId)
  cachedWishlist = next
  cachedValue = JSON.stringify(next)
  window.localStorage.setItem(storageKey, cachedValue)
  notify()
}

export function useWishlist() {
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
    } else if (userId && currentUserId === userId && serverState !== null) {
      setSynced(true)
    }
  }, [hasCheckedSession, userId])

  const productIds = useSyncExternalStore(
    subscribeToWishlist,
    getSnapshot,
    getServerSnapshot,
  )
  const hasLoaded = hasCheckedSession && (!userId || synced)

  return { productIds, hasLoaded, toggle: toggleWishlistItem, remove: removeWishlistItem }
}