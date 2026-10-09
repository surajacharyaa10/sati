"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Heart, ShieldCheck, ShoppingBag, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCart } from "@/app/components/cart-provider"
import { productBadgeClasses } from "@/lib/product-badges"
import type { StoreProduct } from "@/lib/store-products"
import { useWishlist } from "@/lib/wishlist-store"
import { formatRupees } from "@/lib/currency"
import { getDiscountPercentage } from "@/lib/pricing"

const swatchColors: Record<string, string> = {
  Cobalt: "#2867b2",
  Rust: "#bd481f",
  Ivory: "#eee6d6",
  Ink: "#202124",
  Olive: "#777548",
  Orange: "#ee4c16",
}

export function ProductDetails({ product }: { product: StoreProduct }) {
  const router = useRouter()
  const { addItem } = useCart()
  const wishlist = useWishlist()
  const [selectedColor, setSelectedColor] = useState(product.colors[0])
  const [selectedSize, setSelectedSize] = useState("M")
  const [isAdded, setIsAdded] = useState(false)
  const isFavorite = wishlist.productIds.includes(product.id)

  function addSelectedVariant() {
    addItem({
      id: `${product.id}:${selectedColor}:${selectedSize}`,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      alt: product.alt,
      color: selectedColor,
      size: selectedSize,
    })
  }

  function handleAddToCart() {
    addSelectedVariant()
    setIsAdded(true)
    window.setTimeout(() => setIsAdded(false), 1800)
  }

  function handleBuyNow() {
    addSelectedVariant()
    router.push("/cart")
  }

  return (
    <main className="bg-white text-[#171512]">
      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8 lg:px-14">
        <Link href="/arrival-new" className="inline-flex items-center gap-2 text-xs font-semibold text-[#706c66] transition-colors hover:text-[#e94717]">
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to shopping
        </Link>
      </div>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-6 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-14 lg:px-14">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#f2eee8] lg:aspect-[0.9/1]">
          <Image
            src={product.image}
            alt={product.alt}
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 54vw"
            className="object-cover"
          />
          <Badge className={`absolute left-4 top-4 rounded-none px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] ${productBadgeClasses[product.label]}`}>
            {product.label}
          </Badge>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isFavorite}
            onClick={() => wishlist.toggle(product.id)}
            className="absolute right-4 top-4 size-10 rounded-full border-0 bg-white hover:bg-white hover:text-[#e94717]"
          >
            <Heart aria-hidden="true" className={isFavorite ? "size-4 fill-[#e94717] text-[#e94717]" : "size-4"} />
          </Button>
        </div>

        <div className="flex flex-col py-1 lg:py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#e94717]">
            {product.audience} / {product.category}
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-[0.98] sm:text-5xl">{product.name}</h1>

          <a href="#reviews" className="mt-4 inline-flex w-fit items-center gap-2 text-xs hover:text-[#e94717]">
            <span aria-label={`Rated ${product.rating} out of 5`} className="tracking-[0.1em] text-[#e94717]">★★★★★</span>
            <span className="font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-[#817c75]">({product.reviewCount} reviews)</span>
          </a>

          <div className="mt-5">
            <p className={`text-3xl font-semibold ${product.originalPrice ? "text-[#e94717]" : "text-[#171512]"}`}>
              {formatRupees(product.price)}
            </p>
            {product.originalPrice && (
              <div className="mt-1 flex items-center gap-2 text-xs">
                <del className="text-[#8b867e]">{formatRupees(product.originalPrice)}</del>
                {getDiscountPercentage(product.originalPrice, product.price) > 0 && (
                  <span className="font-semibold text-[#706c66]">-{getDiscountPercentage(product.originalPrice, product.price)}%</span>
                )}
              </div>
            )}
          </div>

          <p className="mt-5 max-w-lg text-sm leading-6 text-[#706c66]">{product.description}</p>

          <fieldset className="mt-7">
            <legend className="mb-3 text-xs font-semibold">Color <span className="font-normal text-[#817c75]">/ {selectedColor}</span></legend>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Select ${color}`}
                  aria-pressed={selectedColor === color}
                  onClick={() => setSelectedColor(color)}
                  className={`size-7 rounded-full border-2 p-0.5 ${selectedColor === color ? "border-[#171512]" : "border-transparent"}`}
                >
                  <span className="block size-full rounded-full border border-black/10" style={{ backgroundColor: swatchColors[color] ?? "#d2c5b1" }} />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-7">
            <legend className="mb-3 text-xs font-semibold">Size <span className="font-normal text-[#817c75]">/ {selectedSize}</span></legend>
            <div className="grid max-w-md grid-cols-5 gap-2">
              {product.sizes.map((size) => (
                <Button
                  key={size}
                  type="button"
                  variant={selectedSize === size ? "default" : "outline"}
                  aria-pressed={selectedSize === size}
                  onClick={() => setSelectedSize(size)}
                  className={selectedSize === size
                    ? "h-10 rounded-sm bg-[#171512] text-xs text-white hover:bg-[#e94717]"
                    : "h-10 rounded-sm border-black/15 bg-white text-xs hover:border-[#e94717]"}
                >
                  {size}
                </Button>
              ))}
            </div>
            <button type="button" className="mt-3 text-[12px] font-semibold underline underline-offset-4 hover:text-[#e94717]">
              Size guide
            </button>
          </fieldset>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <Button type="button" onClick={handleBuyNow} className="h-12 rounded-full bg-[#171512] text-xs font-semibold text-white hover:bg-[#e94717]">
              Buy now <ArrowLeft aria-hidden="true" className="size-4 rotate-180" />
            </Button>
            <Button type="button" variant="outline" onClick={handleAddToCart} className="h-12 rounded-full border-black/20 bg-white text-xs font-semibold hover:border-[#e94717] hover:text-[#e94717]">
              {isAdded ? <Check aria-hidden="true" className="size-4" /> : <ShoppingBag aria-hidden="true" className="size-4" />}
              {isAdded ? "Added to cart" : "Add to cart"}
            </Button>
          </div>
          <p role="status" className="sr-only">{isAdded ? `${product.name} added to cart` : ""}</p>

          <div className="mt-7 grid gap-3 border-y border-black/10 py-4 text-[12px] text-[#706c66] sm:grid-cols-2">
            <p className="flex items-center gap-2"><Truck aria-hidden="true" className="size-4 text-[#e94717]" /> Free shipping over {formatRupees(120)}</p>
            <p className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-4 text-[#e94717]" /> Easy 30-day returns</p>
          </div>

          <div className="mt-6 space-y-4">
            <details className="group border-b border-black/10 pb-4" open>
              <summary className="cursor-pointer list-none text-xs font-semibold">Details & fit <span className="float-right text-[#e94717] group-open:hidden">+</span><span className="float-right hidden text-[#e94717] group-open:inline">−</span></summary>
              <p className="mt-3 text-xs leading-5 text-[#706c66]">{product.fit}. Available in sizes {product.sizes[0]}–{product.sizes.at(-1)}. {product.description}</p>
            </details>
            <details className="group border-b border-black/10 pb-4">
              <summary className="cursor-pointer list-none text-xs font-semibold">Materials & care <span className="float-right text-[#e94717] group-open:hidden">+</span><span className="float-right hidden text-[#e94717] group-open:inline">−</span></summary>
              <p className="mt-3 text-xs leading-5 text-[#706c66]">{product.material}. Wash inside out with similar colors and reshape while damp.</p>
            </details>
          </div>

        </div>
      </section>

      <section id="reviews" aria-labelledby="reviews-title" className="mx-auto max-w-7xl border-t border-black/10 px-5 py-12 sm:px-8 sm:py-16 lg:px-14">
        <div className="mb-8 border-b border-black/10 pb-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#e94717]">Customer feedback</p>
          <h2 id="reviews-title" className="font-serif text-3xl">Reviews & ratings</h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-12">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-5xl">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-[#817c75]">out of 5</span>
            </div>
            <p aria-label={`Rated ${product.rating} out of 5 stars`} className="mt-2 text-lg tracking-[0.12em] text-[#e94717]">
              <span aria-hidden="true">★★★★★</span>
            </p>
            <p className="mt-2 text-xs text-[#706c66]">Based on {product.reviewCount} customer ratings</p>
          </div>

          <div className="flex min-h-28 items-center border-t border-black/10 pt-5 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
            <p className="max-w-xl text-sm leading-6 text-[#706c66]">
              Written customer reviews are not available for this item yet. The rating above summarizes customer feedback.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}