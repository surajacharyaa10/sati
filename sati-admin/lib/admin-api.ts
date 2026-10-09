const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001").replace(/\/+$/, "")

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
  const { _retry, body, ...init } = options
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 401 && !_retry) {
    const refreshed = await request<T>(path, { ...init, body, _retry: true })
    return refreshed
  }

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

export const adminAuth = {
  me: () => request<{ user: { id: string; name: string; email: string; avatarUrl: string | null } }>(
    "/api/auth/me",
  ),
  signIn: (credentials: { email: string; password: string }) =>
    request<{ user: { id: string; name: string; email: string; avatarUrl: string | null } }>(
      "/api/auth/signin",
      { method: "POST", body: credentials as unknown as BodyInit },
    ),
  signOut: () => request<void>("/api/auth/signout", { method: "POST" }),
}

export const adminApi = {
  products: {
    list: (query?: Record<string, string>) => {
      const qs = query ? "?" + new URLSearchParams(query).toString() : ""
      return request<Product[]>(`/api/products${qs}`)
    },
    get: (id: string) => request<Product>(`/api/products/${encodeURIComponent(id)}`),
    create: (body: Partial<Product>) =>
      request<Product>("/api/products", { method: "POST", body: body as unknown as BodyInit }),
    update: (id: string, body: Partial<Product>) =>
      request<Product>(`/api/products/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: body as unknown as BodyInit,
      }),
    delete: (id: string) => request<void>(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  orders: {
    list: () => request<Order[]>("/api/orders/me"),
    get: (id: string) => request<Order>(`/api/orders/me/${encodeURIComponent(id)}`),
  },
  users: {
    list: () => request<User[]>("/api/users").then((users) => users.filter(isCustomer)),
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