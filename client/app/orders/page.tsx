"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import {
  ArrowRight,
  PackageCheck,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Calendar,
  Lock,
  Loader2,
  ReceiptText,
} from "lucide-react"
import { Footer } from "@/app/components/footer"
import { Navbar } from "@/app/components/navbar"
import { useAuth } from "@/app/components/auth-provider"
import { ordersApi, type Order } from "@/lib/api"
import { formatRupees } from "@/lib/currency"

function getStatusBadge(status: Order["status"]) {
  switch (status) {
    case "confirmed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          <CheckCircle2 className="size-3.5" /> Confirmed
        </span>
      )
    case "processing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
          <Clock className="size-3.5" /> Processing
        </span>
      )
    case "shipped":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-semibold text-purple-700">
          <Truck className="size-3.5" /> Shipped
        </span>
      )
    case "delivered":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700">
          <PackageCheck className="size-3.5" /> Delivered
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
          <Clock className="size-3.5" /> {status || "Pending"}
        </span>
      )
  }
}

function OrdersContent() {
  const { isAuthenticated, hasCheckedSession } = useAuth()
  const searchParams = useSearchParams()
  const paymentSuccess = searchParams.get("payment") === "success"
  const orderIdParam = searchParams.get("orderId")
  const sessionId = searchParams.get("session_id")

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If just completed payment, dispatch cart change event so cart badges clear/update
    if (paymentSuccess && typeof window !== "undefined") {
      window.dispatchEvent(new Event("sati:cart-change"))
    }

    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    ordersApi
      .list()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [isAuthenticated, paymentSuccess])

  if (hasCheckedSession && !isAuthenticated) {
    return (
      <div className="flex flex-col items-start py-16 sm:py-20">
        <Lock aria-hidden="true" className="size-10 text-[#e94717]" />
        <h2 className="mt-5 font-serif text-2xl">Sign in to view orders</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-[#706c66]">
          Please sign in to your SATI account to view your purchase history and tracking details.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#171512] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#e94717]"
        >
          Sign in <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Payment Success Banner */}
      {paymentSuccess && (
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 sm:p-6 text-emerald-900 shadow-sm">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-xl sm:text-2xl text-emerald-900">
                Payment Successful!
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-emerald-700">
                Thank you for your order. Your payment has been confirmed and we're preparing your SATI pieces.
              </p>
              {(orderIdParam || sessionId) && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="text-[11px] font-mono text-emerald-800">
                    Reference ID: {orderIdParam || sessionId}
                  </p>
                  <Link
                    href={`/payment-success?${orderIdParam ? `orderId=${orderIdParam}` : ""}${
                      sessionId ? `&session_id=${sessionId}` : ""
                    }`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
                  >
                    <ReceiptText className="size-3.5" /> View Payment Slip
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-[#e94717]" />
          <span className="ml-3 text-xs text-[#706c66]">Loading your orders…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-start py-16 sm:py-20">
          <PackageCheck aria-hidden="true" className="size-10 text-[#e94717]" />
          <h2 className="mt-5 font-serif text-2xl">No orders yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#706c66]">
            Once you place an order via Stripe or eSewa, your order details and delivery updates will appear right here.
          </p>
          <Link
            href="/arrival-new"
            className="mt-6 inline-flex h-11 items-center gap-3 rounded-full bg-[#171512] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#e94717]"
          >
            Shop new arrivals <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6 py-6">
          {orders.map((order) => {
            const orderIdentifier = order.id || order._id || ""
            const date = new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            return (
              <div
                key={orderIdentifier}
                className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition-all hover:border-black/20"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/8 bg-[#fbf9f5] px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs">
                    <div>
                      <span className="text-[#8e8a83]">Order </span>
                      <span className="font-mono font-semibold text-[#171512]">
                        #{orderIdentifier.slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#8e8a83]">
                      <Calendar className="size-3.5" />
                      <span>{date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="text-sm font-bold text-[#171512]">
                      {formatRupees(order.subtotal)}
                    </span>
                    <Link
                      href={`/payment-success?orderId=${orderIdentifier}`}
                      className="ml-1 inline-flex items-center gap-1 rounded-full border border-black/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#171512] transition-colors hover:border-[#171512] hover:bg-black/5"
                    >
                      <ReceiptText className="size-3 text-[#e94717]" />
                      Slip
                    </Link>
                  </div>
                </div>

                {/* Items in order */}
                <div className="divide-y divide-black/5 px-5 sm:px-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 py-4">
                      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-[#f7f3eb]">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-black/20">
                            <Package className="size-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-[#171512]">
                          {item.name}
                        </h4>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#8e8a83]">
                          {item.color && <span>Color: {item.color}</span>}
                          {item.size && <span>Size: {item.size}</span>}
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs font-semibold text-[#171512]">
                        {formatRupees(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

export default function OrdersPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[60vh] bg-white text-[#171512]">
        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-14">
          <div className="border-b border-black/10 pb-6 sm:pb-8">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#e94717]">
              Your SATI account
            </p>
            <h1 className="font-serif text-4xl leading-none sm:text-5xl">Order history</h1>
          </div>

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-6 animate-spin text-[#e94717]" />
              </div>
            }
          >
            <OrdersContent />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  )
}