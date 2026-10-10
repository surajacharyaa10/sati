// In the browser, use relative URLs so requests go through Next.js's own
// origin and the session cookie (set by the same host via the rewrite proxy)
// is forwarded correctly. In SSR contexts we fall back to the full backend URL.
const API_BASE =
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001").replace(/\/+$/, "")

type FetchOptions = Omit<RequestInit, "body"> & { body?: unknown; _retry?: boolean }

export type Product = {
  id: string
  name: string
  audience: "Women" | "Men"
  category: "Sets" | "Dresses" | "Outerwear" | "Tops"
  details: string
  description: string
  material: string
  fit: string
  sizes: string[]
  colors: string[]
  rating: number
  reviewCount: number
  price: number
  originalPrice?: number
  label: "New" | "Limited" | "Bestseller" | "Sale"
  image: string
  alt: string
  stock: number
  active: boolean
  images?: { url: string; alt?: string; size?: string; color?: string }[]
}

export type OrderItem = {
  productId: string
  name: string
  price: number
  originalPrice?: number
  image: string
  alt: string
  size?: string
  color?: string
  quantity: number
}

export type Order = {
  id: string
  items: OrderItem[]
  subtotal: number
  totalSavings: number
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  createdAt: string
  updatedAt: string
}

export type User = {
  _id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export type AdminSummary = {
  products: number
  orders: number
  revenue: number
  savings: number
  customers: number
  statusCounts: Record<string, number>
  topProducts: { name: string; units: number; revenue: number }[]
  recentOrders: Order[]
}

// The admin account is authenticated via environment credentials, not a
// customer record. A stray user document with the admin email exists in the
// database, so filter it out of customer-facing metrics and lists.
export function isCustomer(user: { email?: string | null }): boolean {
  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_USERNAME ?? "admin").trim().toLowerCase()
  return (user.email ?? "").trim().toLowerCase() !== adminEmail
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, ...init } = options
  const isFormData = body instanceof FormData
  const headers: Record<string, string> = {
    ...((init.headers as Record<string, string>) || {}),
  }
  if (!isFormData) {
    headers["Content-Type"] = "application/json"
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers,
    ...init,
    body: body === undefined ? undefined : (isFormData ? (body as BodyInit) : JSON.stringify(body)),
  })

  const responseBody: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      responseBody && typeof responseBody === "object" && "error" in responseBody && typeof (responseBody as { error: unknown }).error === "string"
        ? (responseBody as { error: string }).error
        : `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return responseBody as T
}

// Admin routes reject with 401 ("Not signed in") when the session cookie is
// missing or holds a customer JWT. They reject with 403 ("Admin access
// required") when the session is valid but belongs to a customer account.
// In either case, authenticate as admin (which sets the cookie) and retry
// the original request once. The retry never re-signs in, so a failed
// credential cannot loop.
async function requestWithSessionRenewal<T>(path: string, options: FetchOptions = {}): Promise<T> {
  try {
    return await request<T>(path, options)
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Not signed in" || error.message === "Admin access required")
    ) {
      await adminAuth.signIn({
        email: process.env.NEXT_PUBLIC_ADMIN_USERNAME ?? "admin",
        password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "",
      })
      return request<T>(path, options)
    }
    throw error
  }
}

export type AdminUser = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  role?: string
  isAdmin?: boolean
}

export const adminAuth = {
  me: () => request<{ user: AdminUser }>("/api/auth/admin"),
  signIn: (credentials: { email: string; password: string }) =>
    request<{ user: AdminUser }>(
      "/api/auth/signin",
      { method: "POST", body: credentials as unknown as BodyInit },
    ),
  signOut: () => request<void>("/api/auth/signout", { method: "POST" }),
}

export type JournalPost = {
  slug: string
  category: string
  title: string
  summary: string
  readTime: string
  image: string
  alt: string
  paragraphs: string[]
  active?: boolean
  createdAt?: string
  updatedAt?: string
}

export type Notification = {
  _id: string
  title: string
  text: string
  image?: string
  imageAlt?: string
  type: "info" | "promo" | "alert"
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export const adminApi = {
  products: {
    list: (query?: Record<string, string>) => {
      const qs = query ? "?" + new URLSearchParams(query).toString() : ""
      return requestWithSessionRenewal<Product[]>(`/api/products${qs}`)
    },
    get: (id: string) =>
      requestWithSessionRenewal<Product>(`/api/products/${encodeURIComponent(id)}`),
    upload: (body: FormData) =>
      requestWithSessionRenewal<{ url: string }>("/api/products/upload", {
        method: "POST",
        body,
      }),
    create: (body: Partial<Product>) =>
      requestWithSessionRenewal<Product>("/api/products", {
        method: "POST",
        body: body as unknown as BodyInit,
      }),
    update: (id: string, body: Partial<Product>) =>
      requestWithSessionRenewal<Product>(`/api/products/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: body as unknown as BodyInit,
      }),
    delete: (id: string) =>
      requestWithSessionRenewal<void>(`/api/products/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },
  orders: {
    list: () => requestWithSessionRenewal<Order[]>("/api/orders/me"),
    get: (id: string) =>
      requestWithSessionRenewal<Order>(`/api/orders/me/${encodeURIComponent(id)}`),
  },
  users: {
    list: () =>
      requestWithSessionRenewal<User[]>("/api/users").then((users) => users.filter(isCustomer)),
  },
  journal: {
    list: () => requestWithSessionRenewal<JournalPost[]>("/api/journal"),
    get: (slug: string) =>
      requestWithSessionRenewal<JournalPost>(`/api/journal/${encodeURIComponent(slug)}`),
    create: (body: Partial<JournalPost>) =>
      requestWithSessionRenewal<JournalPost>("/api/journal", {
        method: "POST",
        body: body as unknown as BodyInit,
      }),
    update: (slug: string, body: Partial<JournalPost>) =>
      requestWithSessionRenewal<JournalPost>(`/api/journal/${encodeURIComponent(slug)}`, {
        method: "PUT",
        body: body as unknown as BodyInit,
      }),
    upload: (body: FormData) =>
      requestWithSessionRenewal<{ url: string }>("/api/journal/upload", {
        method: "POST",
        body,
      }),
    delete: (slug: string) =>
      requestWithSessionRenewal<void>(`/api/journal/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      }),
  },
  notifications: {
    list: () => requestWithSessionRenewal<Notification[]>("/api/notifications/all"),
    upload: (body: FormData) =>
      requestWithSessionRenewal<{ url: string }>("/api/notifications/upload", {
        method: "POST",
        body,
      }),
    create: (body: Partial<Notification>) =>
      requestWithSessionRenewal<Notification>("/api/notifications", {
        method: "POST",
        body: body as unknown as BodyInit,
      }),
    update: (id: string, body: Partial<Notification>) =>
      requestWithSessionRenewal<Notification>(`/api/notifications/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: body as unknown as BodyInit,
      }),
    delete: (id: string) =>
      requestWithSessionRenewal<{ success: boolean }>(
        `/api/notifications/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
  },
  summary: async (): Promise<AdminSummary> => {
    const [products, orders, customers] = await Promise.all([
      adminApi.products.list(),
      adminApi.orders.list(),
      adminApi.users.list(),
    ])

    const statusCounts: Record<string, number> = {}
    let revenue = 0
    let savings = 0
    const productSales: Record<string, { name: string; units: number; revenue: number }> = {}

    for (const order of orders) {
      statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1
      revenue += order.subtotal
      savings += order.totalSavings
      for (const item of order.items) {
        const existing = productSales[item.productId] ?? {
          name: item.name,
          units: 0,
          revenue: 0,
        }
        existing.units += item.quantity
        existing.revenue += item.price * item.quantity
        productSales[item.productId] = existing
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    const recentOrders = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

    return {
      products: products.length,
      orders: orders.length,
      revenue,
      savings,
      customers: customers.length,
      statusCounts,
      topProducts,
      recentOrders,
    }
  },
}
