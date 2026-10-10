"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, Heart, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { productBadgeClasses } from "@/lib/product-badges"
import {
  fetchCollectionByKind,
  getProductGallery,
  useProducts,
  type CollectionKind,
  type ProductCategory,
  type StoreCollection,
  type StoreProduct,
} from "@/lib/store-products"
import { useWishlist } from "@/lib/wishlist-store"
import { useAuth } from "@/app/components/auth-provider"
import { formatRupees } from "@/lib/currency"
import { getDiscountPercentage } from "@/lib/pricing"

type SortOrder = "Featured" | "Price low" | "Price high"

const sortOrders: SortOrder[] = ["Featured", "Price low", "Price high"]

function filterProductsByKind(products: StoreProduct[], kind: CollectionKind) {
  if (kind === "women") return products.filter((product) => product.audience === "Women")
  if (kind === "men") return products.filter((product) => product.audience === "Men")
  if (kind === "sale") return products.filter((product) => product.originalPrice !== undefined)
  return products
}

export function CollectionScreen({ kind }: { kind: CollectionKind }) {
  const [collection, setCollection] = useState<StoreCollection | null>(null)
  const [collectionLoading, setCollectionLoading] = useState(true)
  const [collectionError, setCollectionError] = useState<string | null>(null)
  const { products: allProducts, loading, error: productsError } = useProducts()
  const products = filterProductsByKind(allProducts, kind)
  const availableCategories = [...new Set(products.map((product) => product.category))]
  const [category, setCategory] = useState<ProductCategory | "All">("All")
  const [sortOrder, setSortOrder] = useState<SortOrder>("Featured")
  const wishlist = useWishlist()

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollectionLoading(true)
    setCollectionError(null)
    fetchCollectionByKind(kind)
      .then((data) => {
        if (!cancelled) setCollection(data)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setCollection(null)
          setCollectionError(cause instanceof Error ? cause.message : "Unable to load collection")
        }
      })
      .finally(() => {
        if (!cancelled) setCollectionLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [kind])

  const selectedCategory = category === "All" || availableCategories.includes(category) ? category : "All"
  const categoryOptions: (ProductCategory | "All")[] = ["All", ...availableCategories]
  const filteredProducts = products.filter((product) => selectedCategory === "All" || product.category === selectedCategory)
  const visibleProducts = sortOrder === "Price low"
    ? [...filteredProducts].sort((a, b) => a.price - b.price)
    : sortOrder === "Price high"
      ? [...filteredProducts].sort((a, b) => b.price - a.price)
      : filteredProducts

  return (
    <main className="bg-white text-[#171512]">
      {collectionLoading ? (
        <section aria-busy="true" className="grid animate-pulse lg:min-h-[460px] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="min-h-[260px] bg-[#f7f3eb] sm:min-h-[340px] lg:min-h-[460px]" />
          <div className="min-h-[260px] bg-[#e9e1d4] sm:min-h-[340px] lg:min-h-[460px]" />
        </section>
      ) : collection ? (
        <section className={`grid lg:min-h-[460px] lg:grid-cols-[0.9fr_1.1fr] ${collection.tone === "orange" ? "bg-[#e94717] text-white" : "bg-[#f7f3eb]"}`}>
          <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-[clamp(3rem,7vw,7rem)]">
            <p className={`mb-5 text-[11px] font-bold uppercase tracking-[0.23em] ${collection.tone === "orange" ? "text-white/80" : "text-[#e94717]"}`}>
              {collection.eyebrow}
            </p>
            <h1 className="max-w-lg font-serif text-5xl leading-[0.9] sm:text-6xl">
              {collection.title}
            </h1>
            <p className={`mt-6 max-w-md text-sm leading-6 ${collection.tone === "orange" ? "text-white/80" : "text-[#706c66]"}`}>
              {collection.description}
            </p>
          </div>
          <div className="relative min-h-[260px] overflow-hidden bg-[#e9e1d4] sm:min-h-[340px] lg:min-h-[460px]">
            <Image
              src={collection.image}
              alt={collection.imageAlt}
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 55vw"
              className="object-cover object-center"
            />
            <Badge className="absolute bottom-4 left-4 rounded-full bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#171512] hover:bg-white sm:bottom-6 sm:left-6">
              {collection.imageLabel}
            </Badge>
          </div>
        </section>
      ) : (
        <section role="alert" className="px-6 py-16 text-center text-sm text-[#706c66]">
          {collectionError ?? "This collection is unavailable."}
        </section>
      )}

      <section aria-label="Collection products" className="py-10 sm:py-14">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-[12px] text-[#817c75]">
                {loading ? "Loading styles…" : `${visibleProducts.length} styles`}
              </p>
              <div className="flex flex-wrap gap-2" aria-label="Filter by category">
                {categoryOptions.map((item) => (
                  <Button
                    key={item}
                    type="button"
                    size="sm"
                    variant={selectedCategory === item ? "default" : "outline"}
                    aria-pressed={selectedCategory === item}
                    onClick={() => setCategory(item)}
                    className={selectedCategory === item
                      ? "h-8 rounded-full bg-[#171512] px-4 text-[12px] text-white hover:bg-[#e94717]"
                      : "h-8 rounded-full border-black/15 bg-transparent px-4 text-[12px] hover:border-[#e94717] hover:text-[#e94717]"}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[12px] font-semibold">Sort by</span>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 min-w-28 items-center justify-between gap-3 rounded-full border border-black/15 bg-white px-3 text-[12px] font-semibold hover:border-[#e94717] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e94717]">
                  {sortOrder}
                  <ChevronDown aria-hidden="true" className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  {sortOrders.map((item) => (
                    <DropdownMenuItem key={item} onClick={() => setSortOrder(item)}>
                      {item}
                      {sortOrder === item && <Check aria-hidden="true" className="ml-auto size-3.5" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {productsError ? (
          <p role="alert" className="px-6 py-12 text-center text-sm text-[#706c66]">{productsError}</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 px-3 pt-6 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-10 sm:px-4 lg:gap-x-4 lg:px-6">
            {visibleProducts.length === 0 && !loading ? (
              <p className="col-span-full py-8 text-center text-sm text-[#706c66]">No products found in this collection.</p>
            ) : visibleProducts.map((product) => (
                <CollectionProductCard
                  key={product.id}
                  product={product}
                  isFavorite={wishlist.productIds.includes(product.id)}
                  onToggleFavorite={() => wishlist.toggle(product.id)}
                />
              ))}
          </div>
        )}
      </section>

      <section className="mx-5 mb-14 bg-[#f7f3eb] px-5 py-10 text-center sm:mx-8 sm:mb-20 sm:px-8 sm:py-14 lg:mx-auto lg:max-w-[calc(80rem-7rem)]">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#e94717]">Sola members</p>
        <h2 className="font-serif text-3xl sm:text-4xl">10% off your first order</h2>
        <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-[#706c66]">
          Join the list for new drops, studio stories and a welcome treat.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-flex h-10 items-center rounded-full bg-[#171512] px-6 text-[12px] font-semibold text-white transition-colors hover:bg-[#e94717] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e94717]"
        >
          Join the community
        </Link>
      </section>
    </main>
  )
}

function CollectionProductCard({
  product,
  isFavorite,
  onToggleFavorite,
}: {
  product: StoreProduct
  isFavorite: boolean
  onToggleFavorite: () => void
}) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const gallery = getProductGallery(product)
  const secondaryImage = gallery.length > 1 ? gallery[1] : null

  return (
    <Card className="group/card gap-0 rounded-sm bg-white py-0 text-[#171512] shadow-none ring-0">
      <CardContent className="relative aspect-[4/5] p-0">
        <div className="absolute inset-0 overflow-hidden bg-[#f2eee8]">
          <Link href={`/product/${product.id}`} aria-label={`View ${product.name} details`} className="absolute inset-0 z-0">
            <Image
              src={product.image}
              alt={product.alt}
              fill
              sizes="(max-width: 639px) 48vw, (max-width: 1023px) 46vw, 24vw"
              className={`object-cover transition-all duration-500 group-hover/card:scale-[1.03] ${secondaryImage ? "group-hover/card:opacity-0" : ""}`}
            />
            {secondaryImage && (
              <Image
                src={secondaryImage.url}
                alt={secondaryImage.alt || product.alt}
                fill
                sizes="(max-width: 639px) 48vw, (max-width: 1023px) 46vw, 24vw"
                className="object-cover transition-all duration-500 opacity-0 group-hover/card:opacity-100 group-hover/card:scale-[1.03]"
              />
            )}
          </Link>
          <Badge className={`absolute left-2.5 top-2.5 z-10 rounded-none px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${productBadgeClasses[product.label]}`}>
            {product.label}
          </Badge>
          {gallery.length > 1 && (
            <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
              <span>{gallery.length} photos</span>
            </div>
          )}
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
            aria-pressed={isFavorite}
            onClick={() => isAuthenticated ? onToggleFavorite() : router.push("/login")}
            className="absolute right-2.5 top-2.5 z-10 size-9 rounded-full border-0 bg-white text-[#171512] hover:bg-white hover:text-[#e94717]"
          >
            <Heart aria-hidden="true" className={isFavorite ? "size-4 fill-[#e94717] text-[#e94717]" : "size-4"} />
            {!isAuthenticated && <Lock className="absolute -right-1 -top-1 size-4 text-[#e94717]" />}
          </Button>
        </div>
      </CardContent>
      <CardHeader className="grid-cols-[1fr_auto] gap-1 px-3 pt-3 pb-4">
        <CardTitle className="text-xs font-semibold sm:text-sm">
          <Link href={`/product/${product.id}`} className="hover:text-[#e94717]">{product.name}</Link>
        </CardTitle>
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs font-semibold">
          {product.originalPrice && <del className="text-[12px] font-normal text-[#8b867e]">{formatRupees(product.originalPrice)}</del>}
          <span className={product.originalPrice ? "text-[#e94717]" : ""}>{formatRupees(product.price)}</span>
        </div>
        <CardDescription className="col-span-2 text-[12px] text-[#817c75]">
          {product.details}
        </CardDescription>
        {getDiscountPercentage(product.originalPrice, product.price) > 0 && (
          <Badge className="col-span-2 w-fit rounded-none bg-[#fae5dd] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c43d17] hover:bg-[#fae5dd]">
            {getDiscountPercentage(product.originalPrice, product.price)}% off
          </Badge>
        )}
      </CardHeader>
    </Card>
  )
}