"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Heart, Trash2 } from "lucide-react"
import { Footer } from "@/app/components/footer"
import { Navbar } from "@/app/components/navbar"
import { AddToBagButton } from "@/app/components/add-to-bag-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { productBadgeClasses } from "@/lib/product-badges"
import { storeProducts } from "@/lib/store-products"
import { useWishlist } from "@/lib/wishlist-store"
import { formatRupees } from "@/lib/currency"
import { getDiscountPercentage } from "@/lib/pricing"

export default function WishlistPage() {
  const { productIds, hasLoaded, remove } = useWishlist()
  const products = storeProducts.filter((product) => productIds.includes(product.id))

  return (
    <>
      <Navbar />
      <main className="min-h-[60vh] bg-white text-[#171512]">
        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-14">
          <div className="border-b border-black/10 pb-6 sm:pb-8">
            <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[#e94717]">Your saved pieces</p>
            <div className="flex items-end justify-between gap-4">
              <h1 className="font-serif text-4xl leading-none sm:text-5xl">Wishlist</h1>
              {hasLoaded && <p className="text-xs text-[#817c75]">{products.length} {products.length === 1 ? "piece" : "pieces"}</p>}
            </div>
          </div>

          {!hasLoaded ? (
            <div role="status" className="py-16 text-sm text-[#706c66]">Loading your wishlist…</div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-start py-16 sm:py-20">
              <Heart aria-hidden="true" className="size-9 text-[#e94717]" />
              <h2 className="mt-5 font-serif text-2xl">Keep the pieces you love close</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#706c66]">
                Tap the heart on a product to save it here for later.
              </p>
              <Link
                href="/arrival-new"
                className="mt-6 inline-flex h-11 items-center gap-5 rounded-full bg-[#171512] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#e94717] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e94717]"
              >
                Explore new arrivals <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 py-8 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-6">
              {products.map((product) => (
                <Card key={product.id} className="group/card gap-0 rounded-sm bg-white py-0 text-[#171512] shadow-none ring-0">
                  <CardContent className="relative aspect-[4/5] p-0">
                    <Link href={`/product/${product.id}`} aria-label={`View ${product.name}`} className="absolute inset-0">
                      <Image src={product.image} alt={product.alt} fill sizes="(max-width: 639px) 48vw, 24vw" className="object-cover transition-transform duration-500 group-hover/card:scale-[1.03]" />
                    </Link>
                    <span className={`absolute left-2.5 top-2.5 rounded-none px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] ${productBadgeClasses[product.label]}`}>
                      {product.label}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Remove ${product.name} from wishlist`}
                      onClick={() => remove(product.id)}
                      className="absolute right-2.5 top-2.5 size-9 rounded-full border-0 bg-white text-[#e94717] hover:bg-white"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                  </CardContent>
                  <CardHeader className="grid-cols-[1fr_auto] gap-1 px-3 pt-3 pb-4">
                    <CardTitle className="text-xs font-semibold sm:text-sm">
                      <Link href={`/product/${product.id}`} className="hover:text-[#e94717]">{product.name}</Link>
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      {product.originalPrice && <del className="text-[10px] text-[#8b867e]">{formatRupees(product.originalPrice)}</del>}
                      <p className={`text-xs font-semibold ${product.originalPrice ? "text-[#e94717]" : ""}`}>{formatRupees(product.price)}</p>
                      {getDiscountPercentage(product.originalPrice, product.price) > 0 && (
                        <span className="rounded-sm bg-[#fae5dd] px-1.5 py-0.5 text-[8px] font-bold text-[#c43d17]">
                          {getDiscountPercentage(product.originalPrice, product.price)}% off
                        </span>
                      )}
                    </div>
                    <CardDescription className="col-span-2 text-[10px] text-[#817c75]">{product.details}</CardDescription>
                    <div className="col-span-2 pt-2"><AddToBagButton product={product} /></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}