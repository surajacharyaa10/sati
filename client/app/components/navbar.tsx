
"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, ShoppingBag, UserRound, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/app/components/auth-provider"
import { useCart } from "@/app/components/cart-provider"
import { useWishlist } from "@/lib/wishlist-store"
import { formatRupees } from "@/lib/currency"
import { NotificationsPanel } from "@/app/components/notifications-panel"
import { useProducts, matchesSearch } from "@/lib/store-products"

const navLinks = [
  { label: "New in", href: "/arrival-new" },
  { label: "Women", href: "/women" },
  { label: "Men", href: "/men" },
  { label: "Journal", href: "/journal" },
  { label: "Sale", href: "/sale" },
]

export function Navbar() {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const searchContainerRef = React.useRef<HTMLDivElement>(null)

  const { products: allProducts } = useProducts()
  const { user, hasCheckedSession, signOut } = useAuth()
  const { itemCount } = useCart()

  const {
    productIds: wishlistProductIds,
    hasLoaded: wishlistHasLoaded,
  } = useWishlist()

  const wishlistCount = wishlistHasLoaded
    ? wishlistProductIds.length
    : 0

  const trimmedQuery = searchQuery.trim()
  const liveMatches = React.useMemo(() => {
    if (!trimmedQuery) return []
    return allProducts.filter((product) => matchesSearch(product, trimmedQuery))
  }, [allProducts, trimmedQuery])

  // Close search on click outside or escape key
  React.useEffect(() => {
    if (!searchOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [searchOpen])

  function handleSearchSubmit(event?: React.FormEvent) {
    if (event) event.preventDefault()
    if (!trimmedQuery) return
    setSearchOpen(false)
    setMobileNavOpen(false)
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
  }

  function handleQuickSearch(tag: string) {
    setSearchQuery(tag)
    setSearchOpen(false)
    setMobileNavOpen(false)
    router.push(`/search?q=${encodeURIComponent(tag)}`)
  }

  async function handleSignOut() {
    setIsSigningOut(true)

    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Shipping announcement */}
      <div className="flex min-h-9 items-center justify-center bg-[#e94717] px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-white sm:text-sm">
        Free shipping on orders over {formatRupees(120)} — easy returns within
        30 days
      </div>

      {/* Main navbar */}
      <div className="relative border-b border-black/10 bg-[#f7f3eb]">
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-14">
          {/* Logo */}
          <Link href="/" aria-label="Sati home" className="shrink-0">
            <Image
              src="/logo/logo.png"
              alt="SATI"
              width={80}
              height={80}
              priority
              className="size-20 object-contain mix-blend-multiply"
            />
          </Link>

          {/* Desktop navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-8 lg:flex xl:gap-10"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors hover:text-[#e94717] xl:text-base ${
                  link.label === "Sale"
                    ? "text-[#e94717]"
                    : "text-[#171512]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Navbar actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search */}
            <div className="sm:relative" ref={searchContainerRef}>
              <Button
                variant="ghost"
                size="icon"
                className={`size-9 rounded-full text-[#171512] transition-colors ${
                  searchOpen ? "bg-black/10 text-[#e94717]" : "hover:bg-black/5"
                }`}
                onClick={() => {
                  setSearchOpen((open) => {
                    const next = !open
                    if (next) {
                      setTimeout(() => searchInputRef.current?.focus(), 60)
                    }
                    return next
                  })
                }}
                aria-label="Search"
                aria-expanded={searchOpen}
              >
                <Search className="size-[19px]" />
              </Button>

              {searchOpen && (
                <>
                  {/* Backdrop for mobile */}
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden"
                    onClick={() => setSearchOpen(false)}
                    aria-hidden="true"
                  />

                  <div className="absolute left-3 right-3 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-black/10 bg-[#f7f3eb] shadow-2xl animate-in fade-in zoom-in-95 duration-150 sm:left-auto sm:right-0 sm:mt-3 sm:w-[26rem]">
                    {/* Search Input Bar */}
                    <form
                      role="search"
                      onSubmit={handleSearchSubmit}
                      className="flex items-center gap-2 border-b border-black/10 bg-white px-3.5 py-2.5"
                    >
                      <Search className="size-4 shrink-0 text-[#8b867e]" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        inputMode="search"
                        placeholder="Search dresses, tops, men, silk…"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="h-9 min-w-0 flex-1 bg-transparent text-sm text-[#171512] outline-none placeholder:text-[#8b867e] [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden"
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("")
                            searchInputRef.current?.focus()
                          }}
                          className="shrink-0 rounded-full p-1 text-[#8b867e] hover:bg-black/5 hover:text-[#171512]"
                          aria-label="Clear search"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={!trimmedQuery}
                        className="shrink-0 rounded-full bg-[#171512] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#e94717] disabled:opacity-40"
                      >
                        Search
                      </button>
                    </form>

                  {/* Search Dropdown Body */}
                  <div className="max-h-[min(24rem,65vh)] overflow-y-auto p-3">
                    {trimmedQuery ? (
                      liveMatches.length > 0 ? (
                        <div className="space-y-1">
                          <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-bold uppercase tracking-wider text-[#8b867e]">
                            <span>Matching Products ({liveMatches.length})</span>
                            <button
                              type="button"
                              onClick={() => handleSearchSubmit()}
                              className="text-[#e94717] hover:underline"
                            >
                              View all →
                            </button>
                          </div>
                          {liveMatches.slice(0, 5).map((product) => (
                            <Link
                              key={product.id}
                              href={`/product/${product.id}`}
                              onClick={() => setSearchOpen(false)}
                              className="group flex items-center gap-3 rounded-lg p-2 transition hover:bg-white"
                            >
                              <div className="relative size-12 shrink-0 overflow-hidden rounded bg-[#f2eee8]">
                                <Image
                                  src={product.image}
                                  alt={product.alt || product.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover transition group-hover:scale-105"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-[#171512] group-hover:text-[#e94717]">
                                  {product.name}
                                </p>
                                <p className="text-[10px] text-[#8b867e]">
                                  {product.audience} · {product.category}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs font-semibold ${product.originalPrice ? "text-[#e94717]" : "text-[#171512]"}`}>
                                  {formatRupees(product.price)}
                                </span>
                              </div>
                            </Link>
                          ))}
                          {liveMatches.length > 5 && (
                            <button
                              type="button"
                              onClick={() => handleSearchSubmit()}
                              className="mt-2 block w-full rounded-lg bg-black/5 py-2 text-center text-xs font-semibold text-[#171512] transition hover:bg-[#e94717] hover:text-white"
                            >
                              See all {liveMatches.length} results for &ldquo;{trimmedQuery}&rdquo; →
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="py-6 text-center">
                          <p className="text-sm font-semibold text-[#171512]">No products found</p>
                          <p className="mt-1 text-xs text-[#8b867e]">
                            We couldn&apos;t find anything matching &ldquo;{trimmedQuery}&rdquo;. Try another keyword.
                          </p>
                        </div>
                      )
                    ) : (
                      <div>
                        <p className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-wider text-[#8b867e]">
                          Popular Categories
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {["Dresses", "Sets", "Outerwear", "Tops", "Women", "Men", "Sale", "New"].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleQuickSearch(tag)}
                              className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium text-[#171512] transition hover:border-[#e94717] hover:bg-white hover:text-[#e94717]"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            </div>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-9 items-center justify-center rounded-full text-[#171512] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e94717]"
                aria-label="Profile menu"
              >
                <UserRound
                  aria-hidden="true"
                  className="size-[19px]"
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-52 text-sm"
              >
                {!hasCheckedSession ? (
                  <DropdownMenuItem disabled>
                    Checking session…
                  </DropdownMenuItem>
                ) : user ? (
                  <>
                    <DropdownMenuItem disabled>
                      {user.name}
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                      <Link href="/account" className="block w-full py-0.5">
                        My Account
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                      <Link href="/orders" className="block w-full py-0.5">
                        Orders
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                      <Link
                        href="/wishlist"
                        className="relative block w-full py-0.5"
                        aria-label={`Wishlist, ${wishlistCount} ${
                          wishlistCount === 1 ? "item" : "items"
                        }`}
                      >
                        Wishlist
                        {wishlistCount > 0 && (
                          <span className="ml-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#e94717] px-1 py-0.5 text-[10px] font-bold text-white">
                            {wishlistCount > 99 ? "99+" : wishlistCount}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                    >
                      {isSigningOut ? "Logging out…" : "Log out"}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem>
                      <Link href="/login" className="block w-full py-0.5">
                        Sign In
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                      <Link href="/signup" className="block w-full py-0.5">
                        Create account
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <NotificationsPanel />

            {/* Shopping bag */}
            <Link
              href="/cart"
              aria-label={`Shopping bag, ${itemCount} ${
                itemCount === 1 ? "item" : "items"
              }`}
              className="relative inline-flex size-9 items-center justify-center rounded-full text-[#171512] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e94717]"
            >
              <ShoppingBag
                aria-hidden="true"
                className="size-[19px]"
              />

              {itemCount > 0 && (
                <span className="absolute right-0 top-0 flex size-[15px] items-center justify-center rounded-full bg-[#e94717] text-[10px] font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              type="button"
              aria-label={
                mobileNavOpen
                  ? "Close navigation"
                  : "Open navigation"
              }
              aria-expanded={mobileNavOpen}
              onClick={() =>
                setMobileNavOpen((open) => !open)
              }
              className="inline-flex size-9 items-center justify-center rounded-full text-[#171512] hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e94717] lg:hidden"
            >
              {mobileNavOpen ? (
                <X className="size-[19px]" />
              ) : (
                <Menu className="size-[19px]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileNavOpen && (
          <nav
            aria-label="Mobile navigation"
            className="grid gap-px border-t border-black/10 bg-black/10 lg:hidden"
          >
            <div className="bg-[#f7f3eb] p-4">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-2 rounded-full border border-black/15 bg-white px-3.5 py-2"
              >
                <Search className="size-4 shrink-0 text-[#8b867e]" />
                <input
                  type="text"
                  inputMode="search"
                  placeholder="Search the collection…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-[#171512] outline-none placeholder:text-[#8b867e] [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden"
                />
                <button
                  type="submit"
                  disabled={!trimmedQuery}
                  className="rounded-full bg-[#171512] px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
                >
                  Search
                </button>
              </form>
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileNavOpen(false)}
                className={`bg-[#f7f3eb] px-6 py-4 text-base font-semibold transition-colors hover:text-[#e94717] ${
                  link.label === "Sale"
                    ? "text-[#e94717]"
                    : "text-[#171512]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}

