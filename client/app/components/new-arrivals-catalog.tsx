"use client"

import { useMemo, useState } from "react"
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

const categories = ["All", "Sets", "Dresses", "Outerwear", "Tops"] as const
type Category = (typeof categories)[number]
type SortOrder = "Featured" | "Price low" | "Price high"

const products = [
  { id: "mara-utility-set", name: "Mara Utility Set", category: "Sets", details: "Sets · 4 colors", price: 148, label: "New", image: "/assets/image3.jpeg", alt: "Model in a blue tailored outfit against a teal backdrop" },
  { id: "sienna-pinstripe", name: "Sienna Pinstripe", category: "Sets", details: "Sets · 3 colors", price: 186, label: "Limited", image: "/assets/image8.jpeg", alt: "Models wearing colorful everyday pieces outdoors" },
  { id: "rio-weekend-shirt", name: "Rio Weekend Shirt", category: "Tops", details: "Tops · 4 colors", price: 94, label: "Bestseller", image: "/assets/image9.jpeg", alt: "Model wearing a relaxed green overshirt" },
  { id: "nova-wide-leg-set", name: "Nova Wide-Leg Set", category: "Sets", details: "Sets · 4 colors", price: 164, label: "New", image: "/assets/image10.jpeg", alt: "Model in a vivid red matching set" },
  { id: "atlas-wool-coat", name: "Atlas Wool Coat", category: "Outerwear", details: "Outerwear · 4 colors", price: 208, label: "New", image: "/assets/image4.jpeg", alt: "Designer reviewing a new clothing silhouette in the studio" },
  { id: "oren-relaxed-set", name: "Oren Relaxed Set", category: "Sets", details: "Sets · 4 colors", price: 132, label: "Sale", image: "/assets/image7.jpeg", alt: "Tailoring patterns ready for a new collection" },
  { id: "calder-knit-polo", name: "Calder Knit Polo", category: "Tops", details: "Tops · 3 colors", price: 82, label: "New", image: "/assets/image3.jpeg", alt: "Blue tailored look with a clean modern silhouette" },
  { id: "milo-linen-layer", name: "Milo Linen Layer", category: "Tops", details: "Tops · 4 colors", price: 104, label: "Bestseller", image: "/assets/image10.jpeg", alt: "Red outfit styled as a lightweight layered look" },
  { id: "ellis-day-dress", name: "Ellis Day Dress", category: "Dresses", details: "Dresses · 3 colors", price: 138, label: "New", image: "/assets/image8.jpeg", alt: "Colorful fashion campaign outdoors" },
  { id: "remy-cropped-jacket", name: "Remy Cropped Jacket", category: "Outerwear", details: "Outerwear · 2 colors", price: 172, label: "Limited", image: "/assets/image9.jpeg", alt: "Relaxed green shirt styled as light outerwear" },
  { id: "cleo-column-dress", name: "Cleo Column Dress", category: "Dresses", details: "Dresses · 4 colors", price: 156, label: "New", image: "/assets/image10.jpeg", alt: "Red statement look from the color collection" },
  { id: "sol-ribbed-top", name: "Sol Ribbed Top", category: "Tops", details: "Tops · 5 colors", price: 68, label: "Sale", image: "/assets/image3.jpeg", alt: "Blue studio styling from the latest collection" },
] as const

const sortOrders: SortOrder[] = ["Featured", "Price low", "Price high"]

export function NewArrivalsCatalog() {
  const [category, setCategory] = useState<Category>("All")
  const [sortOrder, setSortOrder] = useState<SortOrder>("Featured")
  const [favorites, setFavorites] = useState<string[]>([])

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => category === "All" || product.category === category)
    if (sortOrder === "Price low") return [...filtered].sort((a, b) => a.price - b.price)
    if (sortOrder === "Price high") return [...filtered].sort((a, b) => b.price - a.price)
    return filtered
  }, [category, sortOrder])

  function toggleFavorite(productId: string) {
    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((favoriteId) => favoriteId !== productId)
        : [...current, productId],
    )
  }

  return (
    <main className="bg-white text-[#171512]">
      <section className="grid bg-[#f7f3eb] lg:min-h-[390px] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-[clamp(3rem,7vw,7rem)]">
          <p className="mb-5 text-[9px] font-bold uppercase tracking-[0.23em] text-[#e94717]">
            Sola / All
          </p>
          <h1 className="max-w-lg font-serif text-5xl leading-[0.9] sm:text-6xl">
            All new
            <br />
            arrivals
          </h1>
          <p className="mt-6 max-w-md text-sm leading-6 text-[#706c66]">
            The complete summer edit: fresh shapes, saturated color and instant everyday favorites.
          </p>
        </div>
        <div className="relative min-h-[260px] overflow-hidden bg-[#e9e1d4] sm:min-h-[340px] lg:min-h-[390px]">
          <Image
            src="/assets/image8.jpeg"
            alt="A colorful new-season fashion campaign"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 55vw"
            className="object-cover object-center"
          />
          <Badge className="absolute bottom-4 left-4 rounded-full bg-white px-4 py-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-[#171512] hover:bg-white sm:bottom-6 sm:left-6">
            Summer edit ’25
          </Badge>
        </div>
      </section>

      <section aria-label="New arrival products" className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-14">
          <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-[10px] text-[#817c75]">{visibleProducts.length} styles</p>
            <div className="flex flex-wrap gap-2" aria-label="Filter by category">
              {categories.map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={category === item ? "default" : "outline"}
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
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
          {visibleProducts.map((product) => {
            const isFavorite = favorites.includes(product.id)

            return (
              <Card key={product.id} className="group/card gap-0 rounded-sm bg-white py-0 text-[#171512] shadow-none ring-0">
                <CardContent className="relative aspect-[4/5] p-0">
                  <div className="absolute inset-0 overflow-hidden bg-[#f2eee8]">
                    <Image
                      src={product.image}
                      alt={product.alt}
                      fill
                      sizes="(max-width: 639px) 48vw, (max-width: 1023px) 46vw, 24vw"
                      className="object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
                    />
                    <Badge className="absolute left-2.5 top-2.5 rounded-none bg-white px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-[#171512] hover:bg-white">
                      {product.label}
                    </Badge>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      aria-label={isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
                      aria-pressed={isFavorite}
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute right-2.5 top-2.5 size-9 rounded-full border-0 bg-white text-[#171512] hover:bg-white hover:text-[#e94717]"
                    >
                      <Heart aria-hidden="true" className={isFavorite ? "size-4 fill-[#e94717] text-[#e94717]" : "size-4"} />
                    </Button>
                  </div>
                </CardContent>
                <CardHeader className="grid-cols-[1fr_auto] gap-1 px-3 pt-3 pb-4">
                  <CardTitle className="text-xs font-semibold sm:text-sm">{product.name}</CardTitle>
                  <p className="shrink-0 text-xs font-semibold">${product.price}</p>
                  <CardDescription className="col-span-2 text-[10px] text-[#817c75]">
                    {product.details}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
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