"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { productBadgeClasses } from "@/lib/product-badges"
import { useProducts } from "@/lib/store-products"
import { useWishlist } from "@/lib/wishlist-store"
import { formatRupees } from "@/lib/currency"
import { getDiscountPercentage } from "@/lib/pricing"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const categories = ["All", "Women", "Men"] as const
type Category = (typeof categories)[number]

export function NewArrivals() {
  const { products: allProducts, loading } = useProducts()
  const [selectedCategory, setSelectedCategory] = useState<Category>("All")
  const wishlist = useWishlist()
  const products = allProducts.filter((product) => product.label === "New").slice(0, 4)
  const visibleProducts = products.filter(
    (product) => selectedCategory === "All" || product.audience === selectedCategory,
  )

  return (
    <section id="new-arrivals" className="bg-white py-14 text-[#171512] sm:py-20">
      {/* Section heading and category filters */}
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="mb-7 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.23em] text-[#e94717]">
              Fresh from the studio
            </p>
            <h2 className="font-serif text-4xl leading-none sm:text-5xl">
              Just landed
            </h2>
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Filter new arrivals">
            {categories.map((category) => (
              <Button
                key={category}
                type="button"
                size="sm"
                variant={selectedCategory === category ? "default" : "outline"}
                aria-pressed={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? "h-8 rounded-full bg-[#171512] px-4 text-[12px] text-white hover:bg-[#e94717]"
                    : "h-8 rounded-full border-black/15 bg-transparent px-4 text-[12px] hover:border-[#e94717] hover:text-[#e94717]"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Product grid or loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 px-3 pt-2 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-10 sm:px-4 lg:gap-x-4 lg:px-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="aspect-[4/5] animate-pulse rounded-md bg-[#f2eee8]"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 px-3 pt-2 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-10 sm:px-4 lg:gap-x-4 lg:px-6">
          {visibleProducts.map((product) => {
            const isFavorite = wishlist.productIds.includes(product.id)

            return (
              <Card
                key={product.id}
                className="group/card gap-0 rounded-md bg-white py-0 text-[#171512] shadow-sm ring-1 ring-black/10"
              >
                <CardContent className="relative aspect-[4/5] p-0">
                  <div className="absolute inset-0 overflow-hidden bg-[#f2eee8]">
                    <Link
                      href={`/product/${product.id}`}
                      aria-label={`View ${product.name} details`}
                      className="absolute inset-0 z-0"
                    >
                      <Image
                        src={product.image}
                        alt={product.alt}
                        fill
                        sizes="(max-width: 639px) 48vw, (max-width: 1023px) 46vw, 24vw"
                        className="object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
                      />
                    </Link>

                    <Badge
                      className={`absolute left-2.5 top-2.5 z-10 rounded-none px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${productBadgeClasses[product.label]}`}
                    >
                      {product.label}
                    </Badge>

                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      aria-label={
                        isFavorite
                          ? `Remove ${product.name} from favorites`
                          : `Add ${product.name} to favorites`
                      }
                      aria-pressed={isFavorite}
                      onClick={() => wishlist.toggle(product.id)}
                      className="absolute right-2.5 top-2.5 z-10 size-9 rounded-full border-0 bg-white text-[#171512] hover:bg-white hover:text-[#e94717]"
                    >
                      <Heart
                        aria-hidden="true"
                        className={
                          isFavorite
                            ? "size-4 fill-[#e94717] text-[#e94717]"
                            : "size-4"
                        }
                      />
                    </Button>
                  </div>
                </CardContent>

                <CardHeader className="grid-cols-[1fr_auto] gap-1 px-3 pt-3 pb-4">
                  <CardTitle className="text-xs font-semibold sm:text-sm">
                    <Link
                      href={`/product/${product.id}`}
                      className="hover:text-[#e94717]"
                    >
                      {product.name}
                    </Link>
                  </CardTitle>

                  <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs font-semibold">
                    {product.originalPrice && (
                      <del className="text-[12px] font-normal text-[#8b867e]">
                        {formatRupees(product.originalPrice)}
                      </del>
                    )}
                    <span
                      className={product.originalPrice ? "text-[#e94717]" : ""}
                    >
                      {formatRupees(product.price)}
                    </span>
                  </div>

                  <CardDescription className="col-span-2 text-[12px] text-[#817c75]">
                    {product.details}
                  </CardDescription>

                  {getDiscountPercentage(
                    product.originalPrice,
                    product.price,
                  ) > 0 && (
                    <Badge className="col-span-2 w-fit rounded-none bg-[#fae5dd] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c43d17] hover:bg-[#fae5dd]">
                      {getDiscountPercentage(
                        product.originalPrice,
                        product.price,
                      )}
                      % off
                    </Badge>
                  )}

                  <Link
                    href="/arrival-new"
                    aria-label={`View ${product.name}`}
                    className="sr-only"
                  >
                    View product
                  </Link>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}

      {/* View all link */}
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="mt-9 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:mt-12">
          <span aria-hidden="true" className="h-px bg-black/10" />

          <Link
            href="/arrival-new"
            className="inline-flex items-center gap-2 border-b border-[#171512] pb-1 text-xs font-semibold text-[#171512] transition-colors hover:border-[#e94717] hover:text-[#e94717] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e94717]"
          >
            View all new arrivals <span aria-hidden="true">→</span>
          </Link>

          <span aria-hidden="true" className="h-px bg-black/10" />
        </div>
      </div>
    </section>
  )


}