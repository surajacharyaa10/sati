import type { StoreProduct } from "./store-products"

export function matchesSearch(product: StoreProduct, query: string): boolean {
  if (!product) return false
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
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return terms.every((term) => searchableText.includes(term))
}
