"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, ArrowRight, X, ChevronDown } from "lucide-react"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { CollectionProductCard } from "@/app/components/collection-screen"
import { useProducts, matchesSearch, type ProductCategory, type StoreProduct } from "@/lib/store-products"
import { useWishlist } from "@/lib/wishlist-store"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const popularSearches = ["Dresses", "Sets", "Outerwear", "Tops", "Women", "Men", "Sale", "New"]
type SortOrder = "Featured" | "Price low" | "Price high"

function SearchResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") ?? ""

  const [inputVal, setInputVal] = useState(initialQuery)
  const [activeQuery, setActiveQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "All">("All")
  const [selectedAudience, setSelectedAudience] = useState<"All" | "Women" | "Men">("All")
  const [sortOrder, setSortOrder] = useState<SortOrder>("Featured")

  const { products, loading } = useProducts()
  const wishlist = useWishlist()

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputVal.trim()
    setActiveQuery(trimmed)
    router.replace(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  function handleTagClick(tag: string) {
    setInputVal(tag)
    setActiveQuery(tag)
    router.replace(`/search?q=${encodeURIComponent(tag)}`)
  }

  // Filter matching products
  const matchingProducts = useMemo(() => {
    return products.filter((p) => matchesSearch(p, activeQuery))
  }, [products, activeQuery])

  // Filter by category and audience
  const filteredProducts = useMemo(() => {
    let result = matchingProducts
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory)
    }
    if (selectedAudience !== "All") {
      result = result.filter((p) => p.audience === selectedAudience)
    }

    if (sortOrder === "Price low") {
      return [...result].sort((a, b) => a.price - b.price)
    }
    if (sortOrder === "Price high") {
      return [...result].sort((a, b) => b.price - a.price)
    }
    return result
  }, [matchingProducts, selectedCategory, selectedAudience, sortOrder])

  const availableCategories = useMemo(() => {
    return [...new Set(matchingProducts.map((p) => p.category))]
  }, [matchingProducts])

  return (
    <main className="min-h-[70vh] bg-white text-[#171512]">
      {/* Search Header Banner */}
      <section className="border-b border-black/10 bg-[#f7f3eb] py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#e94717]">
            Catalog Search
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-5xl">
            {activeQuery ? (
              <>Search results for &ldquo;{activeQuery}&rdquo;</>
            ) : (
              <>Explore the Collection</>
            )}
          </h1>

          {/* Search bar inside page */}
          <form
            onSubmit={handleFormSubmit}
            className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-full border border-black/15 bg-white p-1.5 shadow-sm focus-within:border-[#e94717] focus-within:ring-2 focus-within:ring-[#e94717]/20"
          >
            <div className="flex flex-1 items-center gap-2.5 px-3">
              <Search className="size-4 shrink-0 text-[#8b867e]" />
              <input
                type="search"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Search products by name, category, color, material…"
                className="w-full bg-transparent text-sm text-[#171512] outline-none placeholder:text-[#8b867e]"
              />
              {inputVal && (
                <button
                  type="button"
                  onClick={() => { setInputVal(""); setActiveQuery(""); router.replace("/search") }}
                  className="rounded-full p-1 text-[#8b867e] hover:bg-black/5 hover:text-[#171512]"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="rounded-full bg-[#171512] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#e94717]"
            >
              Search
            </button>
          </form>

          {/* Quick tags */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-[11px] font-medium text-[#8b867e]">Popular:</span>
            {popularSearches.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                  activeQuery.toLowerCase() === tag.toLowerCase()
                    ? "border-[#e94717] bg-[#e94717] text-white"
                    : "border-black/10 bg-white/70 text-[#171512] hover:border-black/30"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Controls Bar */}
      <section className="mx-auto max-w-[1600px] px-5 pt-8 sm:px-8 lg:px-14">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-5">
          <p className="text-xs font-semibold text-[#8b867e]">
            {loading ? "Searching…" : `${filteredProducts.length} ${filteredProducts.length === 1 ? "product" : "products"} found`}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {/* Audience filter */}
            <div className="flex gap-1 rounded-full border border-black/10 bg-[#f7f3eb] p-1 text-xs">
              {(["All", "Women", "Men"] as const).map((aud) => (
                <button
                  key={aud}
                  type="button"
                  onClick={() => setSelectedAudience(aud)}
                  className={`rounded-full px-3 py-1 font-medium transition ${
                    selectedAudience === aud
                      ? "bg-[#171512] text-white"
                      : "text-[#171512] hover:bg-black/5"
                  }`}
                >
                  {aud}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            {availableCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/15 bg-white px-3 text-xs font-semibold hover:border-[#e94717] focus-visible:outline-2 focus-visible:outline-[#e94717]">
                  <SlidersHorizontal className="size-3" />
                  <span>Category: {selectedCategory}</span>
                  <ChevronDown className="size-3 text-[#8b867e]" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs">
                  <DropdownMenuItem onClick={() => setSelectedCategory("All")}>
                    All Categories
                  </DropdownMenuItem>
                  {availableCategories.map((cat) => (
                    <DropdownMenuItem key={cat} onClick={() => setSelectedCategory(cat)}>
                      {cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Sort order */}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/15 bg-white px-3 text-xs font-semibold hover:border-[#e94717] focus-visible:outline-2 focus-visible:outline-[#e94717]">
                <span>Sort: {sortOrder}</span>
                <ChevronDown className="size-3 text-[#8b867e]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                {(["Featured", "Price low", "Price high"] as SortOrder[]).map((so) => (
                  <DropdownMenuItem key={so} onClick={() => setSortOrder(so)}>
                    {so}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </section>

      {/* Results Grid / Empty State */}
      <section className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 sm:py-12 lg:px-14">
        {loading ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-[4/5] rounded-sm bg-[#f2eee8]" />
                <div className="h-4 w-3/4 bg-[#f2eee8]" />
                <div className="h-3 w-1/2 bg-[#f2eee8]" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-6">
            {filteredProducts.map((product) => (
              <CollectionProductCard
                key={product.id}
                product={product}
                isFavorite={wishlist.productIds.includes(product.id)}
                onToggleFavorite={() => wishlist.toggle(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-[#f7f3eb] text-[#8b867e]">
              <Search className="size-7" />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-medium sm:text-3xl">
              No results found
            </h2>
            <p className="mt-2 max-w-md text-sm text-[#8b867e]">
              {activeQuery
                ? `We couldn't find any products matching "${activeQuery}". Try checking your spelling or use more general keywords.`
                : "Enter a search term above to explore our collection."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                variant="default"
                onClick={() => { setInputVal(""); setActiveQuery(""); router.replace("/arrival-new") }}
                className="gap-2 rounded-full bg-[#171512] px-6 text-xs font-semibold text-white hover:bg-[#e94717]"
              >
                Explore New Arrivals <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default function SearchPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-[70vh] bg-white py-20 text-center text-sm text-zinc-500">Loading search…</div>}>
        <SearchResultsContent />
      </Suspense>
      <Footer />
    </>
  )
}
