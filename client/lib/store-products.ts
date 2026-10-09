import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import type { ProductBadgeLabel } from "@/lib/product-badges"

export type ProductCategory = "Sets" | "Dresses" | "Outerwear" | "Tops"
export type ProductAudience = "Women" | "Men"

export type StoreProduct = {
  id: string
  name: string
  audience: ProductAudience
  category: ProductCategory
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
  label: ProductBadgeLabel
  image: string
  alt: string
}

export type CollectionKind = "arrivals" | "women" | "men" | "sale"

export type StoreCollection = {
  id: string
  kind: CollectionKind
  eyebrow: string
  title: string
  description: string
  image: string
  imageAlt: string
  imageLabel: string
  tone: "cream" | "orange"
}

// Fetches the live catalog from the backend. No product data is hardcoded
// here anymore — every name, price, image and spec comes from the API.
export async function fetchProducts(): Promise<StoreProduct[]> {
  const products = await apiRequest<StoreProduct[]>("/api/products")
  return products
}

export async function fetchCollections(): Promise<StoreCollection[]> {
  const collections = await apiRequest<StoreCollection[]>("/api/collections")
  return collections
}

export async function fetchCollectionByKind(kind: CollectionKind): Promise<StoreCollection> {
  return apiRequest<StoreCollection>(`/api/collections/${kind}`)
}

export function useProducts() {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    fetchProducts()
      .then((data) => {
        if (!cancelled) setProducts(data)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setProducts([])
          setError(cause instanceof Error ? cause.message : "Unable to load products")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { products, loading, error }
}