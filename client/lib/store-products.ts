import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import type { ProductBadgeLabel } from "@/lib/product-badges"

export type ProductCategory = "Sets" | "Dresses" | "Outerwear" | "Tops"
export type ProductAudience = "Women" | "Men"

export type StoreProductImage = {
  url: string
  alt?: string
  size?: string
  color?: string
}

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
  images?: StoreProductImage[]
}

export function getProductGallery(product: {
  image?: string
  alt?: string
  name?: string
  images?: StoreProductImage[]
}): StoreProductImage[] {
  const result: StoreProductImage[] = []
  const seen = new Set<string>()

  if (Array.isArray(product.images)) {
    for (const item of product.images) {
      if (item?.url && !seen.has(item.url)) {
        seen.add(item.url)
        result.push({
          url: item.url,
          alt: item.alt || product.alt || product.name || "",
          size: item.size,
          color: item.color,
        })
      }
    }
  }

  if (product.image && !seen.has(product.image)) {
    result.unshift({
      url: product.image,
      alt: product.alt || product.name || "",
    })
  }

  if (result.length === 0 && product.image) {
    result.push({ url: product.image, alt: product.alt || product.name || "" })
  }

  return result
}

export function matchesSearch(product: StoreProduct, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const terms = q.split(/\s+/).filter(Boolean)
  const searchableText = [
    product.name,
    product.category,
    product.audience,
    product.description,
    product.details,
    product.material,
    product.fit,
    product.label,
    ...(product.colors || []),
    ...(product.sizes || []),
  ].filter(Boolean).join(" ").toLowerCase()

  return terms.every((term) => searchableText.includes(term))
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