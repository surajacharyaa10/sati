"use client"

import { useSyncExternalStore } from "react"

const storageKey = "sati-wishlist"
const changeEvent = "sati:wishlist-change"
const emptyWishlist: string[] = []
let cachedValue: string | null | undefined
let cachedWishlist = emptyWishlist

function normalizeWishlist(value: unknown) {
  if (!Array.isArray(value)) return emptyWishlist
  return [...new Set(value.filter((id): id is string => typeof id === "string"))]
}

function getWishlistSnapshot() {
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

function getServerWishlistSnapshot() {
  return emptyWishlist
}

function subscribeToWishlist(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(changeEvent, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(changeEvent, onChange)
  }
}

function getClientReadySnapshot() {
  return true
}

function getServerReadySnapshot() {
  return false
}

export function toggleWishlistItem(productId: string) {
  const current = getWishlistSnapshot()
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId]

  cachedWishlist = next
  cachedValue = JSON.stringify(next)
  window.localStorage.setItem(storageKey, cachedValue)
  window.dispatchEvent(new Event(changeEvent))
}

export function removeWishlistItem(productId: string) {
  const next = getWishlistSnapshot().filter((id) => id !== productId)
  cachedWishlist = next
  cachedValue = JSON.stringify(next)
  window.localStorage.setItem(storageKey, cachedValue)
  window.dispatchEvent(new Event(changeEvent))
}

export function useWishlist() {
  const productIds = useSyncExternalStore(
    subscribeToWishlist,
    getWishlistSnapshot,
    getServerWishlistSnapshot,
  )
  const hasLoaded = useSyncExternalStore(
    subscribeToWishlist,
    getClientReadySnapshot,
    getServerReadySnapshot,
  )
  return { productIds, hasLoaded, toggle: toggleWishlistItem, remove: removeWishlistItem }
}
