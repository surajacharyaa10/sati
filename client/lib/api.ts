export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "")

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, ...requestOptions } = options
  const headers = new Headers(requestOptions.headers)
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData

  if (body !== undefined && !isFormData && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  const response = await fetch(`${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
    ...requestOptions,
    headers,
    credentials: requestOptions.credentials ?? "include",
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  })

  const responseBody: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const errorObj = typeof responseBody === "object" && responseBody !== null ? (responseBody as Record<string, unknown>) : null
    const message =
      typeof errorObj?.error === "string"
        ? errorObj.error
        : typeof errorObj?.message === "string"
        ? errorObj.message
        : `Request failed with status ${response.status}`

    throw new Error(message)
  }

  return responseBody as T
}

export type User = {
  _id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export type UserInput = Pick<User, "name" | "email">
export type CreateUserInput = UserInput & { password: string }
export type AuthUser = { id: string; name: string; email: string; avatarUrl: string | null }

export const authApi = {
  signIn: (credentials: { email: string; password: string }) =>
    apiRequest<{ user: AuthUser }>("/api/auth/signin", { method: "POST", body: credentials }),
  currentUser: () => apiRequest<{ user: AuthUser }>("/api/auth/me"),
  signOut: () => apiRequest<void>("/api/auth/signout", { method: "POST" }),
  updateProfile: (profile: { name: string; email: string; photo?: File; removePhoto?: boolean }) => {
    const body = new FormData()
    body.set("name", profile.name)
    body.set("email", profile.email)
    if (profile.photo) body.set("photo", profile.photo)
    if (profile.removePhoto) body.set("removePhoto", "true")

    return apiRequest<{ user: AuthUser }>("/api/auth/profile", { method: "PATCH", body })
  },
  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    apiRequest<{ message: string }>("/api/auth/change-password", { method: "POST", body: data }),
}

export const wishlistApi = {
  list: () => apiRequest<string[]>("/api/wishlist/me"),
  add: (productId: string) =>
    apiRequest<string[]>("/api/wishlist/me", { method: "POST", body: { productId } }),
  toggle: (productId: string) =>
    apiRequest<{ productIds: string[]; added: boolean }>("/api/wishlist/me/toggle", {
      method: "POST",
      body: { productId },
    }),
  remove: (productId: string) =>
    apiRequest<string[]>(`/api/wishlist/me/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    }),
  // Replaces the whole list — used to merge a guest's local wishlist with the
  // server's when they sign in.
  replace: (productIds: string[]) =>
    apiRequest<string[]>("/api/wishlist/me", { method: "PUT", body: { productIds } }),
}

export const cartApi = {
  list: () => apiRequest<any[]>("/api/cart/me"),
  add: (productId: string, quantity = 1, size?: string, color?: string) =>
    apiRequest<any[]>("/api/cart/me", {
      method: "POST",
      body: { productId, quantity, size, color },
    }),
  update: (productId: string, quantity: number) =>
    apiRequest<any[]>(`/api/cart/me/${encodeURIComponent(productId)}`, {
      method: "PUT",
      body: { quantity },
    }),
  remove: (productId: string) =>
    apiRequest<any[]>(`/api/cart/me/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    }),
  clear: () => apiRequest<any[]>("/api/cart/me", { method: "DELETE" }),
  // Replaces the whole cart — used to merge a guest's local cart with the
  // server's when they sign in.
  replace: (items: any[]) =>
    apiRequest<any[]>("/api/cart/me", { method: "PUT", body: { items } }),
}

export const usersApi = {
  list: () => apiRequest<User[]>("/api/users"),
  get: (id: string) => apiRequest<User>(`/api/users/${encodeURIComponent(id)}`),
  create: (user: CreateUserInput) => apiRequest<User>("/api/users", { method: "POST", body: user }),
  replace: (id: string, user: UserInput) =>
    apiRequest<User>(`/api/users/${encodeURIComponent(id)}`, { method: "PUT", body: user }),
  update: (id: string, changes: Partial<UserInput>) =>
    apiRequest<User>(`/api/users/${encodeURIComponent(id)}`, { method: "PATCH", body: changes }),
  remove: (id: string) =>
    apiRequest<{ message: string }>(`/api/users/${encodeURIComponent(id)}`, { method: "DELETE" }),
}

export type ProductReview = {
  _id: string
  productId: string
  userName: string
  userEmail?: string
  rating: number
  title?: string
  comment: string
  verifiedPurchase: boolean
  createdAt: string
}

export type ReviewStats = {
  rating: number
  reviewCount: number
  distribution: Record<number, number>
}

export const reviewsApi = {
  getReviews: (productId: string) =>
    apiRequest<{ reviews: ProductReview[]; stats: ReviewStats }>(
      `/api/products/${encodeURIComponent(productId)}/reviews`
    ),
  createReview: (
    productId: string,
    data: {
      userName: string
      userEmail?: string
      rating: number
      title?: string
      comment: string
    }
  ) =>
    apiRequest<{ success: boolean; review: ProductReview; stats: ReviewStats }>(
      `/api/products/${encodeURIComponent(productId)}/reviews`,
      { method: "POST", body: data }
    ),
}

// ─── Payment APIs ────────────────────────────────────────────────────────────

export type EsewaConfig = {
  form_url?: string
  amount: number
  transaction_uuid: string
  product_code: string
  product_service_charge: number
  product_delivery_charge: number
  tax_amount: number
  total_amount: number
  success_url: string
  failure_url: string
  signed_field_names: string
  signature: string
}

export type EsewaInitResponse = {
  success: boolean
  payment: { signature: string; signed_field_names: string }
  order: { id: string; subtotal: number; status: string }
  esewaConfig: EsewaConfig
}

export const paymentApi = {
  // Stripe — create checkout session from cart items array or direct item
  stripeCheckout: (
    products: { name: string; image: string; price: number; quantity: number }[],
    directItem?: { productId: string; quantity?: number; size?: string; color?: string },
    address?: string,
    phoneNumber?: string
  ) =>
    apiRequest<{ id: string; url: string }>("/api/stripe/create-checkout-session", {
      method: "POST",
      body: { products, directItem, address, phoneNumber },
    }),

  // eSewa — initialize payment for a single product (Buy Now)
  esewaInitItem: (data: {
    productId: string
    totalPrice?: number
    quantity?: number
    size?: string
    color?: string
    address?: string
    phoneNumber?: string
  }) =>
    apiRequest<EsewaInitResponse>("/api/esewa/initialize-item", {
      method: "POST",
      body: data,
    }),

  // eSewa — initialize payment from full cart
  esewaInitCart: (address?: string, phoneNumber?: string) =>
    apiRequest<EsewaInitResponse>("/api/esewa/initialize", {
      method: "POST",
      body: { address, phoneNumber },
    }),

  // Stripe — verify session status
  verifyStripeSession: (sessionId: string) =>
    apiRequest<{
      success: boolean
      paid: boolean
      session: {
        id: string
        payment_intent?: string
        payment_status: string
        amount_total: number
        currency: string
        customer_email?: string
        customer_name?: string
      }
      order?: Order | null
    }>(`/api/stripe/verify-session/${encodeURIComponent(sessionId)}`),
}

// ─── Orders API ─────────────────────────────────────────────────────────────

export type OrderItem = {
  productId: string
  name: string
  price: number
  originalPrice?: number
  image?: string
  alt?: string
  size?: string
  color?: string
  quantity: number
}

export type PaymentRecord = {
  _id: string
  transactionId?: string
  pidx?: string
  orderId: string
  amount: number
  paymentGateway: "esewa" | "stripe" | "khalti" | "connectIps"
  status: "success" | "pending" | "failed"
  createdAt?: string
  paymentDate?: string
}

export type Order = {
  id: string
  _id?: string
  user: string
  items: OrderItem[]
  subtotal: number
  totalSavings: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  address?: string
  phoneNumber?: string
  createdAt: string
  updatedAt: string
}

export type OrderWithPayment = Order & { payment?: PaymentRecord | null }

export const ordersApi = {
  list: () => apiRequest<Order[]>("/api/orders/me"),
  get: (orderId: string) => apiRequest<OrderWithPayment>(`/api/orders/me/${encodeURIComponent(orderId)}`),
}