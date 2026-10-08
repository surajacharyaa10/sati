import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Footer } from "@/app/components/footer"
import { Navbar } from "@/app/components/navbar"
import { ProductDetails } from "@/app/components/product-details"
import { storeProducts } from "@/lib/store-products"

export function generateStaticParams() {
  return storeProducts.map(({ id }) => ({ id }))
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

async function ProductContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = storeProducts.find((item) => item.id === id)
  if (!product) notFound()
  return <ProductDetails product={product} />
}

function ProductFallback() {
  return (
    <main aria-busy="true" className="mx-auto grid min-h-[70vh] max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:px-14">
      <div className="aspect-[4/5] animate-pulse bg-[#f2eee8]" />
      <div className="space-y-5 py-8">
        <div className="h-3 w-24 animate-pulse bg-[#f2eee8]" />
        <div className="h-12 max-w-md animate-pulse bg-[#f2eee8]" />
        <div className="h-5 w-20 animate-pulse bg-[#f2eee8]" />
      </div>
    </main>
  )
}