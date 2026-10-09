import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Footer } from "@/app/components/footer"
import { Navbar } from "@/app/components/navbar"
import { ProductDetails } from "@/app/components/product-details"
import { apiRequest } from "@/lib/api"
import type { StoreProduct } from "@/lib/store-products"

// Product IDs are no longer known at build time — they live in the backend.
// This page is dynamic so the catalog always reflects the live API.
// `dynamic = "force-dynamic"` is incompatible with `nextConfig.cacheComponents`,
// so we opt out of fetch caching instead — the effect is the same: the page is
// rendered per-request and never served from the build cache.
// `fetchCache` is also not compatible with cacheComponents, so the no-store
// option is passed directly to the fetch call.

async function ProductContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let product: StoreProduct | undefined
  try {
    product = await apiRequest<StoreProduct>(`/api/products/${encodeURIComponent(id)}`, {
      cache: "no-store",
    })
  } catch {
    product = undefined
  }
  if (!product) notFound()
  return <ProductDetails product={product} />
}

function ProductFallback() {
  return (
    <main aria-busy="true" className="mx-auto grid min-h-[70vh] max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:px-14">
      <div className="aspect-4/5 animate-pulse bg-[#f2eee8]" />
      <div className="space-y-5 py-8">
        <div className="h-3 w-24 animate-pulse bg-[#f2eee8]" />
        <div className="h-12 max-w-md animate-pulse bg-[#f2eee8]" />
        <div className="h-5 w-20 animate-pulse bg-[#f2eee8]" />
      </div>
    </main>
  )
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <>
      <Navbar />
      <Suspense fallback={<ProductFallback />}>
        <ProductContent params={params} />
      </Suspense>
      <Footer />
    </>
  )
}