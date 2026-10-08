"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ChevronDown, Heart } from "lucide-react"
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
import { storeProducts, type ProductCategory, type StoreProduct } from "@/lib/store-products"

type CollectionKind = "arrivals" | "women" | "men" | "sale"
type SortOrder = "Featured" | "Price low" | "Price high"

const collections: Record<CollectionKind, {
  eyebrow: string
  title: string
  description: string
  image: string
  imageAlt: string
  imageLabel: string
  tone: "cream" | "orange"
}> = {
  arrivals: {
    eyebrow: "Sola / All",
    title: "All new arrivals",
    description: "The complete summer edit: fresh shapes, saturated color and instant everyday favorites.",
    image: "/assets/image9.jpeg",
    imageAlt: "Model wearing a relaxed green overshirt in a fashion studio",
    imageLabel: "Summer edit ’25",
    tone: "cream",
  },
  women: {
    eyebrow: "Sola / Women",
    title: "Made for her",
    description: "Fluid layers, bold color and everyday ease—pieces that work as hard as you do.",
    image: "/assets/image2.jpeg",
    imageAlt: "Model wearing a vivid orange look outdoors",
    imageLabel: "The women’s edit",
    tone: "cream",
  },
  men: {
    eyebrow: "Sola / Men",
    title: "Made for him",
    description: "Relaxed tailoring and hardworking essentials, designed for every plan and no plan at all.",
    image: "/assets/image7.jpeg",
    imageAlt: "Models wearing expressive red and orange looks",
    imageLabel: "The men’s edit",
    tone: "cream",
  },
  sale: {
    eyebrow: "Up to 40% off selected styles",
    title: "The bright side of sale",
    description: "Last chances, first choices. Considered pieces at a little less.",
    image: "/assets/image7.jpeg",
    imageAlt: "Models wearing colorful outfits in a fashion campaign",
    imageLabel: "Summer edit ’25",
    tone: "orange",
  },
}

const sortOrders: SortOrder[] = ["Featured", "Price low", "Price high"]
const categories: ProductCategory[] = ["Sets", "Dresses", "Outerwear", "Tops"]

function selectProducts(kind: CollectionKind) {
  if (kind === "women") return storeProducts.filter((product) => product.audience === "Women")
  if (kind === "men") return storeProducts.filter((product) => product.audience === "Men")
  if (kind === "sale") return storeProducts.filter((product) => product.originalPrice !== undefined)
  return storeProducts
}

export function CollectionScreen({ kind }: { kind: CollectionKind }) {
  const collection = collections[kind]
  const products = selectProducts(kind)
  const availableCategories = categories.filter((category) => products.some((product) => product.category === category))
  const [category, setCategory] = useState<ProductCategory | "All">("All")
  const [sortOrder, setSortOrder] = useState<SortOrder>("Featured")
  const [favorites, setFavorites] = useState<string[]>([])

  const filteredProducts = products.filter((product) => category === "All" || product.category === category)
  const visibleProducts = sortOrder === "Price low"
    ? [...filteredProducts].sort((a, b) => a.price - b.price)
    : sortOrder === "Price high"
      ? [...filteredProducts].sort((a, b) => b.price - a.price)
      : filteredProducts

  function toggleFavorite(productId: string) {
    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((favoriteId) => favoriteId !== productId)
        : [...current, productId],
    )
  }

  return (
    <main className="bg-white text-[#171512]">
      <section className={`grid lg:min-h-[460px] lg:grid-cols-[0.9fr_1.1fr] ${collection.tone === "orange" ? "bg-[#e94717] text-white" : "bg-[#f7f3eb]"}`}>
        <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-[clamp(3rem,7vw,7rem)]">
          <p className={`mb-5 text-[9px] font-bold uppercase tracking-[0.23em] ${collection.tone === "orange" ? "text-white/80" : "text-[#e94717]"}`}>
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
          <Badge className="absolute bottom-4 left-4 rounded-full bg-white px-4 py-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-[#171512] hover:bg-white sm:bottom-6 sm:left-6">
            {collection.imageLabel}
          </Badge>
        </div>
      </section>

      <section aria-label="Collection products" className="py-10 sm:py-14">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-[10px] text-[#817c75]">{visibleProducts.length} styles</p>
              <div className="flex flex-wrap gap-2" aria-label="Filter by category">
                {["All", ...availableCategories].map((item) => (
                  <Button
                    key={item}
                    type="button"
                    size="sm"
                    variant={category === item ? "default" : "outline"}
                    aria-pressed={category === item}
                    onClick={() => setCategory(item as ProductCategory | "All")}
                    className={category === item
                      ? "h-8 rounded-full bg-[#171512] px-4 text-[10px] text-white hover:bg-[#e94717]"
                      : "h-8 rounded-full border-black/15 bg-transparent px-4 text-[10px] hover:border-[#e94717] hover:text-[#e94717]"}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[10px] font-semibold">Sort by</span>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 min-w-28 items-center justify-between gap-3 rounded-full border border-black/15 bg-white px-3 text-[10px] font-semibold hover:border-[#e94717] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e94717]">
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

        <div className="grid grid-cols-2 gap-x-3 gap-y-8 px-3 pt-6 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-10 sm:px-4 lg:gap-x-4 lg:px-6">
          {visibleProducts.map((product) => (
            <CollectionProductCard
              key={product.id}
              product={product}
              label={kind === "sale" ? "Sale" : product.label}
              isFavorite={favorites.includes(product.id)}
              onToggleFavorite={() => toggleFavorite(product.id)}
            />
          ))}
        </div>
      </section>

      <section className="mx-5 mb-14 bg-[#f7f3eb] px-5 py-10 text-center sm:mx-8 sm:mb-20 sm:px-8 sm:py-14 lg:mx-auto lg:max-w-[calc(80rem-7rem)]">
        <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[#e94717]">Sola members</p>
        <h2 className="font-serif text-3xl sm:text-4xl">10% off your first order</h2>
        <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-[#706c66]">
          Join the list for new drops, studio stories and a welcome treat.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-flex h-10 items-center rounded-full bg-[#171512] px-6 text-[10px] font-semibold text-white transition-colors hover:bg-[#e94717] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e94717]"
        >
          Join the community
        </Link>
      </section>
    </main>
  )
}

function CollectionProductCard({
  product,
  label,
  isFavorite,
  onToggleFavorite,
}: {
  product: StoreProduct
  label: StoreProduct["label"]
  isFavorite: boolean
  onToggleFavorite: () => void
}) {
  return (
    <Card className="group/card gap-0 rounded-sm bg-white py-0 text-[#171512] shadow-none ring-0">
      <CardContent className="relative aspect-[4/5] p-0">
        <div className="absolute inset-0 overflow-hidden bg-[#f2eee8]">
          <Image
            src={product.image}
            alt={product.alt}
            fill
            sizes="(max-width: 639px) 48vw, (max-width: 1023px) 46vw, 24vw"
            className="object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
          />
          <Badge className={`absolute left-2.5 top-2.5 rounded-none px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] ${productBadgeClasses[label]}`}>
            {label}
          </Badge>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
            aria-pressed={isFavorite}
            onClick={onToggleFavorite}
            className="absolute right-2.5 top-2.5 size-9 rounded-full border-0 bg-white text-[#171512] hover:bg-white hover:text-[#e94717]"
          >
            <Heart aria-hidden="true" className={isFavorite ? "size-4 fill-[#e94717] text-[#e94717]" : "size-4"} />
          </Button>
        </div>
      </CardContent>
      <CardHeader className="grid-cols-[1fr_auto] gap-1 px-3 pt-3 pb-4">
        <CardTitle className="text-xs font-semibold sm:text-sm">{product.name}</CardTitle>
        <div className="flex items-start gap-2 text-xs font-semibold">
          <span className={product.originalPrice ? "text-[#e94717]" : ""}>${product.price}</span>
          {product.originalPrice && <del className="text-[10px] font-normal text-[#8b867e]">${product.originalPrice}</del>}
        </div>
        <CardDescription className="col-span-2 text-[10px] text-[#817c75]">
          {product.details}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}