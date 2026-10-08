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

export function getCartSnapshot(): CartItem[] {
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

export function getServerCartSnapshot() {
  return emptyCart
}

export function subscribeToCart(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(changeEvent, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(changeEvent, onChange)
  }
}

function saveCart(items: CartItem[]) {
  cachedCart = items
  cachedValue = JSON.stringify(items)
  window.localStorage.setItem(storageKey, cachedValue)
  window.dispatchEvent(new Event(changeEvent))
}

export function addCartItem(item: Omit<CartItem, "quantity">) {
  const current = getCartSnapshot()
  const existing = current.find((cartItem) => cartItem.id === item.id)
  saveCart(existing
    ? current.map((cartItem) => cartItem.id === item.id
      ? { ...cartItem, quantity: Math.min(cartItem.quantity + 1, 99) }
      : cartItem)
    : [...current, { ...item, quantity: 1 }])
}

export function setCartItemQuantity(id: string, quantity: number) {
  if (quantity < 1) {
    removeCartItem(id)
    return
  }
  saveCart(getCartSnapshot().map((item) => item.id === id
    ? { ...item, quantity: Math.min(Math.trunc(quantity), 99) }
    : item))
}

export function removeCartItem(id: string) {
  saveCart(getCartSnapshot().filter((item) => item.id !== id))
}

export function clearCart() {
  saveCart([])
}