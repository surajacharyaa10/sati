"use client"

import { useEffect, useState } from "react"
import { useSyncExternalStore } from "react"
import { useAuth } from "@/app/components/auth-provider"
import { wishlistApi } from "@/lib/api"

const changeEvent = "sati:wishlist-change"
const emptyWishlist: string[] = []

// Server-synced state. `null` means "no authenticated user" or "sync not yet
// run"; in that case the wishlist is empty. There is no localStorage
// fallback — a wishlist only exists for a signed-in user, so it is always
// scoped to that user's session on the server.
let serverState: string[] | null = null
let currentUserId: string | null = null
let syncInProgress = false

function normalizeWishlist(value: unknown) {
  if (!Array.isArray(value)) return emptyWishlist
  return [...new Set(value.filter((id): id is string => typeof id === "string"))]
}

export function getServerSnapshot() {
  return emptyWishlist
}

export function getSnapshot() {
  if (currentUserId && serverState !== null) return serverState
  return emptyWishlist
}

export function subscribeToWishlist(onChange: () => void) {
  window.addEventListener(changeEvent, onChange)
  return () => {
    window.removeEventListener(changeEvent, onChange)
  }
}

function notify() {
  window.dispatchEvent(new Event(changeEvent))
}

async function syncWithServer(userId: string) {
  if (syncInProgress) return
  syncInProgress = true
  try {
    const server = await wishlistApi.list()
    serverState = server
    currentUserId = userId
    notify()
  } catch {
    // Fall back to an empty wishlist if the request fails.
    serverState = emptyWishlist
    currentUserId = userId
  } finally {
    syncInProgress = false
  }
}

function clearServerState() {
  serverState = null
  currentUserId = null
  // The effect runs after render, so without this the first render after a
  // sign-out would still read the previous user's wishlist. Notify forces the
  // store to re-render with the now-empty snapshot immediately.
  notify()
}

export function toggleWishlistItem(productId: string) {
  if (currentUserId && serverState !== null) {
    wishlistApi
      .toggle(productId)
      .then(({ productIds }) => {
        serverState = productIds
        notify()
      })
      .catch(() => {})
    return
  }
}

export function removeWishlistItem(productId: string) {
  if (currentUserId && serverState !== null) {
    wishlistApi
      .remove(productId)
      .then((productIds) => {
        serverState = productIds
        notify()
      })
      .catch(() => {})
    return
  }
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