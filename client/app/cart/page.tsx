"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, Lock } from "lucide-react"
import { Footer } from "@/app/components/footer"
import { Navbar } from "@/app/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "@/app/components/cart-provider"
import { useAuth } from "@/app/components/auth-provider"
import { formatRupees } from "@/lib/currency"
import { getDiscountPercentage } from "@/lib/pricing"

export default function CartPage() {
  const { items, itemCount, hasLoaded, setQuantity, removeItem } = useCart()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalSavings = items.reduce((sum, item) => sum + Math.max((item.originalPrice ?? item.price) - item.price, 0) * item.quantity, 0)

  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <main className="min-h-[60vh] bg-white text-[#171512]">
          <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-14">
            <div className="flex flex-col items-center py-16 sm:py-20 text-center">
              <ShoppingBag aria-hidden="true" className="size-9 text-[#e94717]" />
              <Lock className="mt-3 size-9 text-[#e94717]" />
              <h2 className="mt-5 font-serif text-2xl">Sign in to view your bag</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#706c66]">
                Your cart is saved locally. Sign in to sync it across devices and check out.
              </p>
              <Button
                className="mt-6 h-11 w-auto rounded-full bg-[#171512] px-5 text-xs font-semibold text-white hover:bg-[#e94717]"
                onClick={() => router.push("/login")}
              >
                Sign in
              </Button>
            </div>
          </section>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[60vh] bg-white text-[#171512]">
        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-14">
          <div className="border-b border-black/10 pb-6 sm:pb-8">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#e94717]">Your selection</p>
            <div className="flex items-end justify-between gap-4">
              <h1 className="font-serif text-4xl leading-none sm:text-5xl">Shopping bag</h1>
              {hasLoaded && <p className="text-xs text-[#817c75]">{itemCount} {itemCount === 1 ? "item" : "items"}</p>}
            </div>
          </div>

          {!hasLoaded ? (
            <div role="status" className="py-16 text-sm text-[#706c66]">Loading your bag…</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-start py-16 sm:py-20">
              <ShoppingBag aria-hidden="true" className="size-9 text-[#e94717]" />
              <h2 className="mt-5 font-serif text-2xl">Your bag is taking a breather</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#706c66]">
                Nothing in your bag yet. Find a favorite and it will be waiting here.
              </p>
              <Link
                href="/arrival-new"
                className="mt-6 inline-flex h-11 items-center gap-5 rounded-full bg-[#171512] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#e94717] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e94717]"
              >
                Shop new arrivals <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14 lg:py-10">
              <section aria-label="Items in your bag" className="divide-y divide-black/10">
                {items.map((item) => (
                  <article key={item.id} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 py-5 first:pt-0 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-6">
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#f2eee8]">
                      <Image src={item.image} alt={item.alt} fill sizes="120px" className="object-cover" />
                    </div>

                    <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <h2 className="font-serif text-lg leading-tight sm:text-xl">{item.name}</h2>
                        {(item.size || item.color) && (
                          <p className="mt-1 text-xs text-[#706c66]">
                            {[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-[#817c75]">Ready to wear · Ships in 2–4 days</p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#706c66] transition-colors hover:text-[#e94717]"
                        >
                          <Trash2 aria-hidden="true" className="size-3.5" /> Remove
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <div className="text-right">
                          {item.originalPrice && (
                            <del className="block text-[12px] text-[#8b867e]">{formatRupees(item.originalPrice * item.quantity)}</del>
                          )}
                          <p className={`text-sm font-semibold ${item.originalPrice ? "text-[#e94717]" : ""}`}>
                            {formatRupees(item.price * item.quantity)}
                          </p>
                          {getDiscountPercentage(item.originalPrice, item.price) > 0 && (
                            <p className="mt-1 text-[11px] font-bold uppercase text-[#c43d17]">
                              {getDiscountPercentage(item.originalPrice, item.price)}% off
                            </p>
                          )}
                        </div>
                        <div className="inline-flex h-9 items-center rounded-full border border-black/15">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Decrease quantity of ${item.name}`}
                            onClick={() => setQuantity(item.id, item.quantity - 1)}
                            className="size-8 rounded-full hover:bg-[#f7f3eb]"
                          >
                            <Minus aria-hidden="true" className="size-3.5" />
                          </Button>
                          <span aria-live="polite" className="w-7 text-center text-xs">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Increase quantity of ${item.name}`}
                            onClick={() => setQuantity(item.id, item.quantity + 1)}
                            className="size-8 rounded-full hover:bg-[#f7f3eb]"
                          >
                            <Plus aria-hidden="true" className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </section>

              <Card className="h-fit gap-0 rounded-md bg-[#f7f3eb] py-0 text-[#171512] ring-0">
                <CardHeader className="border-b border-black/10 px-5 py-4">
                  <CardTitle className="font-serif text-xl">Order summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-5 py-5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#706c66]">Subtotal</span>
                    <span className="font-semibold">{formatRupees(subtotal)}</span>
                  </div>
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-xs text-[#c43d17]">
                      <span>You save</span>
                      <span className="font-semibold">−{formatRupees(totalSavings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-[#706c66]">Shipping</span>
                    <span className="text-[#706c66]">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between border-t border-black/10 pt-4 text-sm font-semibold">
                    <span>Estimated total</span>
                    <span>{formatRupees(subtotal)}</span>
                  </div>
                  <Button type="button" disabled className="h-11 w-full rounded-full bg-[#171512] text-xs font-semibold text-white">
                    Checkout unavailable
                  </Button>
                  <p className="text-center text-[12px] leading-4 text-[#817c75]">
                    Online checkout will be available once payments are connected.
                  </p>
                  <Link href="/arrival-new" className="inline-flex w-full items-center justify-center gap-2 pt-2 text-xs font-semibold hover:text-[#e94717]">
                    Continue shopping <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
