export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001").replace(/\/+$/, "")

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
    const message =
      typeof responseBody === "object" &&
      responseBody !== null &&
      "error" in responseBody &&
      typeof responseBody.error === "string"
        ? responseBody.error
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