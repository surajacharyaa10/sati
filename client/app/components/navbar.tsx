"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, ShoppingBag, UserRound, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { authApi, type AuthUser } from "@/lib/api"
import { useCart } from "@/app/components/cart-provider"
import { formatRupees } from "@/lib/currency"

const navLinks = [
  { label: "New in", href: "/arrival-new" },
  { label: "Women", href: "/women" },
  { label: "Men", href: "/men" },
  { label: "Journal", href: "/journal" },
  { label: "Sale", href: "/sale" },
]

export function Navbar() {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const [currentUser, setCurrentUser] = React.useState<AuthUser | null>(null)
  const [hasCheckedSession, setHasCheckedSession] = React.useState(false)
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const { itemCount } = useCart()

  React.useEffect(() => {
    let isMounted = true

    authApi.currentUser()
      .then(({ user }) => {
        if (isMounted) setCurrentUser(user)
      })
      .catch(() => {
        if (isMounted) setCurrentUser(null)
      })
      .finally(() => {
        if (isMounted) setHasCheckedSession(true)
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await authApi.signOut()
      setCurrentUser(null)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="flex h-7 items-center justify-center bg-[#e94717] px-3 text-center text-[8px] font-bold uppercase tracking-[0.2em] text-white sm:text-[9px]">
        Free shipping on orders over {formatRupees(120)} — easy returns within 30 days
      </div>

      <div className="border-b border-black/10 bg-[#f7f3eb]">
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-14">
          <Link
            href="/"
            aria-label="Sati home"
            className="shrink-0"
          >
            <Image
              src="/logo/logo.jpeg"
              alt="SATI"
              width={80}
              height={80}
              priority
              className="size-20 object-contain mix-blend-multiply"
            />
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[11px] font-semibold transition-colors hover:text-[#e94717] ${
                  link.label === "Sale" ? "text-[#e94717]" : "text-[#171512]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full text-[#171512] hover:bg-black/5"
                onClick={() => setSearchOpen((open) => !open)}
                aria-label="Search"
                aria-expanded={searchOpen}
              >
                <Search className="size-[17px]" />
              </Button>
              {searchOpen && (
                <form
                  role="search"
                  onSubmit={(event) => event.preventDefault()}
                  className="absolute right-0 top-full z-50 mt-3 w-[min(19rem,calc(100vw-2rem))] rounded-md border border-black/10 bg-[#f7f3eb] p-2 shadow-xl"
                >
                  <input
                    type="search"
                    placeholder="Search the collection…"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-10 w-full bg-transparent px-3 text-sm outline-none placeholder:text-[#8b867e] focus-visible:ring-1 focus-visible:ring-[#e94717]"
                    autoFocus
                  />
                </form>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-9 items-center justify-center rounded-full text-[#171512] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e94717]"
                aria-label="Profile menu"
              >
                <UserRound aria-hidden="true" className="size-[17px]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {!hasCheckedSession ? (
                  <DropdownMenuItem disabled>Checking session…</DropdownMenuItem>
                ) : currentUser ? (
                  <>
                    <DropdownMenuItem disabled>{currentUser.name}</DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/account">My Account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/orders">Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/wishlist">Wishlist</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
                      {isSigningOut ? "Logging out…" : "Log out"}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem>
                      <Link href="/login">Sign In</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/signup">Create account</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/cart"
              aria-label={`Shopping bag, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
              className="relative inline-flex size-9 items-center justify-center rounded-full text-[#171512] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e94717]"
            >
              <ShoppingBag aria-hidden="true" className="size-[17px]" />
              {itemCount > 0 && (
                <span className="absolute right-0 top-0 flex size-[15px] items-center justify-center rounded-full bg-[#e94717] text-[8px] font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
              className="inline-flex size-9 items-center justify-center rounded-full text-[#171512] hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e94717] lg:hidden"
            >
              {mobileNavOpen ? <X className="size-[17px]" /> : <Menu className="size-[17px]" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <nav
            aria-label="Mobile navigation"
            className="grid gap-px border-t border-black/10 bg-black/10 lg:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileNavOpen(false)}
                className="bg-[#f7f3eb] px-6 py-3 text-sm font-medium"
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
