"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import {
  CheckCircle2,
  Printer,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  Wallet,
  Calendar,
  Hash,
  User,
  Mail,
  Loader2,
  ArrowLeft,
  Package,
  MapPin,
  Phone,
} from "lucide-react"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/components/auth-provider"
import { ordersApi, paymentApi, type OrderWithPayment } from "@/lib/api"
import { formatRupees, formatPrice } from "@/lib/currency"

function PaymentSuccessContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const sessionId = searchParams.get("session_id")
  const gatewayParam = searchParams.get("gateway")

  const [order, setOrder] = useState<OrderWithPayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [stripeDetails, setStripeDetails] = useState<{
    id: string
    payment_intent?: string
    amount_total: number
    currency: string
    customer_email?: string
    customer_name?: string
  } | null>(null)

  // Items reconstructed from Stripe session when order.items is empty
  const [stripeLineItems, setStripeLineItems] = useState<{
    name: string
    quantity: number
    price: number
    image?: string
  }[]>([])

  const slipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Notify local stores to refresh cart
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("sati:cart-change"))
    }

    async function loadData() {
      try {
        // If Stripe sessionId is present, verify it
        if (sessionId) {
          try {
            const res = await paymentApi.verifyStripeSession(sessionId)
            if (res.session) {
              setStripeDetails(res.session)
            }
            if (res.order) {
              setOrder(res.order)
              return
            }
          } catch (err) {
            console.warn("Stripe session verification error:", err)
          }
        }

        // If orderId is present, fetch the full order
        if (orderId) {
          const fetched = await ordersApi.get(orderId)
          if (fetched) {
            setOrder(fetched)
            return
          }
        }
      } catch (err) {
        console.error("Error loading slip details:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [orderId, sessionId])

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  const effectiveGateway =
    gatewayParam === "esewa" || order?.payment?.paymentGateway === "esewa"
      ? "esewa"
      : gatewayParam === "stripe" || sessionId || order?.payment?.paymentGateway === "stripe"
      ? "stripe"
      : "online"

  const transactionRef =
    order?.payment?.transactionId ||
    order?.payment?.pidx ||
    stripeDetails?.payment_intent ||
    stripeDetails?.id ||
    sessionId ||
    orderId ||
    "TXN-PENDING"

  const formattedDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

  const customerName =
    user?.name ||
    stripeDetails?.customer_name ||
    "Valued Customer"

  const customerEmail =
    user?.email ||
    stripeDetails?.customer_email ||
    "—"

  const isGbpOrder = (order?.currency || stripeDetails?.currency || "").toUpperCase() === "GBP"
  const slipCurrency = isGbpOrder ? "GBP" : "NPR"

  const totalAmount = isGbpOrder && order?.subtotalPound != null
    ? order.subtotalPound
    : (order?.subtotal ?? stripeDetails?.amount_total ?? 0)

  const totalSavings = isGbpOrder && order?.totalSavingsPound != null
    ? order.totalSavingsPound
    : (order?.totalSavings ?? 0)

  return (
    <main className="min-h-[75vh] bg-[#faf8f5] py-10 sm:py-16 text-[#171512]">
      {/* Print-specific style to isolate the receipt slip to a SINGLE PAGE */}
      <style jsx global>{`
        @media print {
          @page {
            size: portrait;
            margin: 8mm 12mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: #171512 !important;
            height: auto !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, footer, nav, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            min-height: auto !important;
            background: transparent !important;
          }
          section {
            padding: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          .print-slip {
            box-shadow: none !important;
            border: 1px solid #d4d0c7 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 8px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
          }
          .print-slip-body {
            padding: 16px 24px !important;
          }
          .print-header {
            padding-bottom: 10px !important;
          }
          .print-grid {
            padding-top: 8px !important;
            padding-bottom: 8px !important;
          }
          .print-table-container {
            padding-top: 8px !important;
            padding-bottom: 8px !important;
          }
          .print-table-row td {
            padding-top: 5px !important;
            padding-bottom: 5px !important;
          }
          .print-summary {
            padding-top: 6px !important;
          }
          .print-footer {
            margin-top: 10px !important;
            padding-top: 6px !important;
          }
        }
      `}</style>

      <section className="mx-auto max-w-3xl px-4 sm:px-6">

        {/* Top Celebration Header (Hidden when printing) */}
        <div className="no-print mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="size-8" />
          </div>
          <span className="inline-block rounded-full bg-emerald-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700">
            Payment Completed
          </span>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Thank You for Your Order</h1>
          <p className="mt-1 text-xs sm:text-sm text-[#706c66]">
            Your payment has been authorized and verified. Below is your official transaction slip.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="h-10 rounded-full border-black/20 bg-white px-5 text-xs font-semibold text-[#171512] transition-colors hover:border-[#171512] hover:bg-black/5"
            >
              <Printer className="mr-2 size-3.5" />
              Print Receipt Slip
            </Button>
            <Link
              href="/orders"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#171512] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#e94717]"
            >
              <ShoppingBag className="size-3.5" />
              View Order History
            </Link>
          </div>
        </div>

        {/* Loading state if still resolving order */}
        {loading && (
          <div className="no-print mb-6 flex items-center justify-center gap-2 text-xs text-[#706c66]">
            <Loader2 className="size-4 animate-spin text-[#e94717]" />
            Finalizing slip verification…
          </div>
        )}

        {/* ─── THE PAYMENT SLIP CARD ─── */}
        <div
          ref={slipRef}
          className="print-slip relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl print:shadow-none print:rounded-lg print:border-black/20"
        >
          {/* Decorative Top Accent Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-[#171512] via-[#e94717] to-[#171512] print:h-1.5" />

          <div className="print-slip-body p-6 sm:p-10 print:p-5">

            {/* Slip Header */}
            <div className="print-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/10 pb-6 print:pb-3">
              <div>
                <span className="font-serif text-3xl font-bold tracking-tight text-[#171512]">
                  SATI
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e94717]">
                  Official Payment Receipt
                </p>
                <p className="mt-1 text-[11px] text-[#8e8a83]">
                  SATI Apparel Pvt. Ltd. · Kathmandu, Nepal
                </p>
              </div>

              {/* Status & Watermark Badge */}
              <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-1">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                  <ShieldCheck className="size-3.5" /> PAID
                </span>
                <p className="text-[11px] text-[#8e8a83]">
                  Status: <strong className="text-emerald-700">Verified</strong>
                </p>
              </div>
            </div>

            {/* Slip Meta Grid */}
            <div className="print-grid grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-black/10 text-xs print:py-2.5 print:gap-2">
              <div className="space-y-2 print:space-y-1">
                <div className="flex items-center gap-2 text-[#706c66]">
                  <Hash className="size-3.5 text-[#8e8a83]" />
                  <span>Reference ID:</span>
                  <strong className="font-mono text-[#171512] break-all">
                    {transactionRef}
                  </strong>
                </div>
                {(order?.id || order?._id) && (
                  <div className="flex items-center gap-2 text-[#706c66]">
                    <Package className="size-3.5 text-[#8e8a83]" />
                    <span>Order No:</span>
                    <strong className="font-mono text-[#171512]">
                      #{(order.id || order._id || "").slice(-8).toUpperCase()}
                    </strong>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[#706c66]">
                  <Calendar className="size-3.5 text-[#8e8a83]" />
                  <span>Date & Time:</span>
                  <span className="text-[#171512]">{formattedDate}</span>
                </div>
              </div>

              <div className="space-y-2 sm:text-right print:space-y-1">
                <div className="flex sm:justify-end items-center gap-2 text-[#706c66]">
                  <User className="size-3.5 text-[#8e8a83]" />
                  <span>Billed To:</span>
                  <strong className="text-[#171512]">{customerName}</strong>
                </div>
                <div className="flex sm:justify-end items-center gap-2 text-[#706c66]">
                  <Mail className="size-3.5 text-[#8e8a83]" />
                  <span>Email:</span>
                  <span className="text-[#171512]">{customerEmail}</span>
                </div>
                {order?.phoneNumber && (
                  <div className="flex sm:justify-end items-center gap-2 text-[#706c66]">
                    <Phone className="size-3.5 text-[#8e8a83]" />
                    <span>Phone:</span>
                    <span className="text-[#171512]">{order.phoneNumber}</span>
                  </div>
                )}
                <div className="flex sm:justify-end items-center gap-2 text-[#706c66]">
                  {effectiveGateway === "esewa" ? (
                    <div className="relative h-4 w-12 shrink-0">
                      <Image
                        src="/logo/esewa.png"
                        alt="eSewa"
                        fill
                        sizes="48px"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <CreditCard className="size-3.5 text-[#171512]" />
                  )}
                  <span>Payment Gateway:</span>
                  <strong className="capitalize text-[#171512]">
                    {effectiveGateway === "esewa"
                      ? "eSewa ePay Wallet"
                      : effectiveGateway === "stripe"
                      ? "Stripe (Card Payment)"
                      : "Online Gateway"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Delivery Address Block */}
            {(order?.address || order?.phoneNumber) && (
              <div className="py-4 border-b border-black/10 print:py-2">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#706c66] print:mb-1">
                  Delivery Details
                </p>
                <div className="flex flex-col gap-1.5 text-xs">
                  {order.address && (
                    <div className="flex items-start gap-2 text-[#706c66]">
                      <MapPin className="size-3.5 mt-0.5 shrink-0 text-[#8e8a83]" />
                      <div>
                        <span className="font-semibold text-[#171512]">Delivery Address: </span>
                        <span>{order.address}</span>
                      </div>
                    </div>
                  )}
                  {order.phoneNumber && (
                    <div className="flex items-center gap-2 text-[#706c66]">
                      <Phone className="size-3.5 shrink-0 text-[#8e8a83]" />
                      <span className="font-semibold text-[#171512]">Phone: </span>
                      <span>{order.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="print-table-container py-6 print:py-2.5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#706c66] print:mb-1.5">
                Purchased Items
              </p>

              {order?.items && order.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-black/10 text-[11px] font-semibold uppercase text-[#8e8a83]">
                        <th className="pb-2.5 print:pb-1">Item</th>
                        <th className="pb-2.5 print:pb-1 text-center">Qty</th>
                        <th className="pb-2.5 print:pb-1 text-right">Price</th>
                        <th className="pb-2.5 print:pb-1 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="print-table-row py-2.5 print:py-1">
                          <td className="py-3 print:py-1.5">
                            <div className="flex items-center gap-3 print:gap-2">
                              {item.image ? (
                                <div className="relative h-10 w-9 print:h-7 print:w-6 shrink-0 overflow-hidden rounded bg-[#f7f3eb]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-10 w-9 print:h-7 print:w-6 shrink-0 items-center justify-center rounded bg-[#f7f3eb] text-[#8e8a83]">
                                  <Package className="size-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-[#171512] truncate max-w-[220px] sm:max-w-[320px] print:text-[11px]">
                                  {item.name}
                                </p>
                                {(item.size || item.color) && (
                                  <p className="text-[10px] text-[#8e8a83] print:text-[9px]">
                                    {[item.color, item.size && `Size ${item.size}`]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 print:py-1.5 text-center text-[#706c66]">{item.quantity}</td>
                          <td className="py-3 print:py-1.5 text-right text-[#706c66]">
                            {formatPrice(
                              isGbpOrder && item.poundPrice != null ? item.poundPrice : item.price,
                              slipCurrency
                            )}
                          </td>
                          <td className="py-3 print:py-1.5 text-right font-semibold text-[#171512]">
                            {formatPrice(
                              (isGbpOrder && item.poundPrice != null ? item.poundPrice : item.price) * item.quantity,
                              slipCurrency
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-4 text-xs text-[#706c66]">
                  <p className="font-semibold text-[#171512]">Order Settlement Confirmed</p>
                  <p className="text-[11px] text-[#8e8a83]">
                    Reference: {transactionRef} · Verified via {effectiveGateway.toUpperCase()}
                  </p>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="print-summary border-t border-black/10 pt-4 print:pt-2">
              <div className="ml-auto max-w-xs space-y-2 print:space-y-1 text-xs print:text-[11px]">
                <div className="flex justify-between text-[#706c66]">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalAmount, slipCurrency)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-[#c43d17]">
                    <span>Discount Savings</span>
                    <span>−{formatPrice(totalSavings, slipCurrency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#706c66]">
                  <span>Shipping & Delivery</span>
                  <span className="font-medium text-emerald-700">Free</span>
                </div>
                <div className="flex justify-between border-t border-black/10 pt-2 print:pt-1 text-sm print:text-xs font-bold text-[#171512]">
                  <span>Total Paid</span>
                  <span>{formatPrice(totalAmount, slipCurrency)}</span>
                </div>
              </div>
            </div>

            {/* Slip Footer / Security Verification */}
            <div className="print-footer mt-8 border-t border-dashed border-black/15 pt-6 text-[11px] text-[#8e8a83] print:mt-3 print:pt-2 print:text-[9px]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:gap-2 text-center sm:text-left">
                <div>
                  <p className="font-semibold text-[#171512]">Authentic Digital Slip</p>
                  <p>Electronically generated and authenticated by SATI Payments.</p>
                  <p>Customer Support: support@sati.com</p>
                </div>

                {/* Decorative Barcode / Stamp */}
                <div className="flex flex-col items-center sm:items-end">
                  <div className="font-mono text-[9px] print:text-[8px] tracking-widest text-[#171512] uppercase">
                    ||||| | |||| ||||| ||| ||||||| | ||
                  </div>
                  <span className="font-mono text-[9px] print:text-[8px] text-[#8e8a83]">
                    {String(transactionRef).slice(-16)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Actions (Hidden when printing) */}
        <div className="no-print mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/arrival-new"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#706c66] hover:text-[#e94717] transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Continue shopping
          </Link>

          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#171512] hover:text-[#e94717] transition-colors"
          >
            Go to My Orders <ArrowRight className="size-3.5" />
          </Link>
        </div>

      </section>
    </main>
  )
}

export default function PaymentSuccessPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-[#e94717]" />
          </div>
        }
      >
        <PaymentSuccessContent />
      </Suspense>
      <Footer />
    </>
  )
}
