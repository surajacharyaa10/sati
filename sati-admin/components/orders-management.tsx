"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Package,
  ChevronDown,
  ChevronUp,
  Search,
  CreditCard,
  Wallet,
  ReceiptText,
  Printer,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  ShieldCheck,
  User,
  Mail,
  Calendar,
  Hash,
  X,
  ExternalLink,
  MapPin,
  Phone,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Order, PaymentInfo } from "@/lib/admin-api"
import { adminApi } from "@/lib/admin-api"
import { useExchangeRate, getDualAmount } from "@/lib/currency"

const ORDER_BADGES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  delivered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
}

function getCustomer(order: Order) {
  if (order.customerName) {
    return { name: order.customerName, email: order.customerEmail || "" }
  }
  if (typeof order.user === "object" && order.user !== null) {
    return { name: order.user.name || "Customer", email: order.user.email || "" }
  }
  return { name: "Customer", email: "" }
}

function checkIsPoundOrder(order: Order): boolean {
  if (order.currency) {
    return order.currency.toUpperCase() === "GBP"
  }
  const payment = order.payment as (PaymentInfo & { currency?: string; dataFromVerificationReq?: { currency?: string } }) | null | undefined
  const paymentCurr = payment?.dataFromVerificationReq?.currency || payment?.currency
  if (paymentCurr) {
    return String(paymentCurr).toUpperCase() === "GBP"
  }
  return false
}

function getPaymentBadge(order: Order) {
  const p = order.payment
  const gateway = p?.paymentGateway || (order.status === "confirmed" ? "esewa" : null)

  if (gateway === "esewa") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1.5 font-medium py-0.5">
        <img src="/logo/esewa.png" alt="eSewa" className="h-3 w-auto object-contain" />
        eSewa ePay
      </Badge>
    )
  }
  if (gateway === "stripe") {
    return (
      <Badge className="bg-indigo-500/15 text-indigo-400 border-indigo-500/30 gap-1 font-medium">
        <CreditCard className="size-3" /> Stripe Card
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground gap-1 font-normal border-border">
      <Clock className="size-3" /> Pending
    </Badge>
  )
}

// ─── Slip Modal for Admin ────────────────────────────────────────────────────
function AdminSlipModal({
  order,
  onClose,
  rate,
}: {
  order: Order
  onClose: () => void
  rate: number
}) {
  const customer = getCustomer(order)
  const p = order.payment
  const gateway = p?.paymentGateway || (order.status === "confirmed" ? "esewa" : "online")
  const txnId = p?.transactionId || p?.pidx || order.id

  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const handlePrint = () => {
    window.print()
  }

  const isPoundOrder = checkIsPoundOrder(order)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white text-[#171512] shadow-2xl overflow-hidden my-8">
        {/* Top Bar */}
        <div className="no-print flex items-center justify-between bg-[#171512] text-white px-6 py-4">
          <div className="flex items-center gap-2">
            <ReceiptText className="size-5 text-[#e94717]" />
            <h3 className="font-serif text-lg">
              Official Payment Receipt Slip ({isPoundOrder ? "GBP £" : "NPR Rs"})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-[#e94717] hover:bg-[#d03d12] text-white rounded-full h-8 px-4 text-xs font-semibold gap-1.5"
            >
              <Printer className="size-3.5" /> Print Slip
            </Button>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-white/70 hover:text-white transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* The Printable Slip Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Slip Header */}
          <div className="flex items-start justify-between border-b border-black/10 pb-4">
            <div>
              <span className="font-serif text-3xl font-bold tracking-tight text-[#171512]">SATI</span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e94717]">
                Official Payment Receipt
              </p>
              <p className="text-[11px] text-[#8e8a83] mt-0.5">
                {isPoundOrder ? "SATI Atelier (UK / Global) · London · support@sati.com" : "SATI Apparel Pvt. Ltd. · Kathmandu, Nepal"}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <ShieldCheck className="size-3.5" /> PAID {isPoundOrder ? "(£ GBP)" : "(Rs NPR)"}
              </span>
              <p className="text-[11px] text-[#8e8a83] mt-1 font-mono">
                Order #{order.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Meta Details */}
          <div className="grid grid-cols-2 gap-4 text-xs border-b border-black/10 pb-4">
            <div className="space-y-1.5">
              <p className="text-[#8e8a83]">
                Customer: <strong className="text-[#171512]">{customer.name}</strong>
              </p>
              {customer.email && (
                <p className="text-[#8e8a83]">
                  Email: <span className="text-[#171512]">{customer.email}</span>
                </p>
              )}
              <p className="text-[#8e8a83]">
                Date: <span className="text-[#171512]">{date}</span>
              </p>
            </div>
            <div className="text-right space-y-1.5">
              <div className="flex items-center justify-end gap-1.5 text-[#8e8a83]">
                <span>Gateway:</span>
                {gateway === "esewa" ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-[#171512]">
                    <img src="/logo/esewa.png" alt="eSewa" className="h-3.5 w-auto object-contain" />
                    eSewa (NPR)
                  </span>
                ) : gateway === "stripe" ? (
                  <strong className="font-semibold text-[#171512]">
                    Stripe Card {isPoundOrder ? "(GBP £)" : "(NPR Rs)"}
                  </strong>
                ) : (
                  <strong className="capitalize text-[#171512]">{gateway} {isPoundOrder ? "(GBP £)" : "(NPR Rs)"}</strong>
                )}
              </div>
              <p className="text-[#8e8a83] font-mono break-all text-[11px]">
                Ref: <span className="text-[#171512]">{txnId}</span>
              </p>
              <p className="text-[#8e8a83]">
                Status: <strong className="text-emerald-700 uppercase">{order.status}</strong>
              </p>
            </div>
          </div>

          {/* Delivery Details */}
          {(order.address || order.phoneNumber) && (
            <div className="rounded-lg bg-[#faf8f5] border border-black/8 px-4 py-3 space-y-1.5 text-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8e8a83] mb-1">Delivery Details</p>
              {order.address && (
                <div className="flex items-start gap-2 text-[#706c66]">
                  <MapPin className="size-3.5 mt-0.5 shrink-0 text-[#8e8a83]" />
                  <div>
                    <span className="font-semibold text-[#171512]">Address: </span>
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
          )}

          {/* Items */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8e8a83] mb-2">Items</p>
            <div className="divide-y divide-black/5 border-y border-black/10">
              {order.items.map((item, idx) => {
                let itemFormattedPrice = ""
                if (isPoundOrder) {
                  const gbp = item.poundPrice != null ? item.poundPrice * item.quantity : (item.price * item.quantity) / (rate || 160)
                  itemFormattedPrice = `£${gbp.toFixed(2)}`
                } else {
                  const npr = item.price * item.quantity
                  itemFormattedPrice = `Rs ${npr.toLocaleString("en-NP")}`
                }

                return (
                  <div key={idx} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="size-8 rounded object-cover border border-black/10 bg-[#f7f3eb]"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-[#171512] truncate">{item.name}</p>
                        <p className="text-[10px] text-[#8e8a83]">
                          {[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(" · ")} · Qty {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#171512]">{itemFormattedPrice}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Total */}
          {(() => {
            let totalFormatted = ""
            if (isPoundOrder) {
              const totalGbp = order.subtotalPound ?? (order.currency === "GBP" ? order.subtotal : order.subtotal / (rate || 160))
              totalFormatted = `£${totalGbp.toFixed(2)}`
            } else {
              totalFormatted = `Rs ${order.subtotal.toLocaleString("en-NP")}`
            }

            return (
              <div className="flex justify-between items-baseline border-t border-black/10 pt-3">
                <div>
                  <span className="font-semibold text-sm text-[#171512]">Total Paid</span>
                  <p className="text-[10px] text-[#8e8a83]">
                    {isPoundOrder ? "Settled in British Pound (£)" : "Settled in Nepalese Rupees (Rs)"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-serif text-2xl font-bold text-[#171512] block">
                    {totalFormatted}
                  </span>
                </div>
              </div>
            )
          })()}

          {/* Watermark / Footer */}
          <div className="flex items-center justify-between border-t border-dashed border-black/15 pt-3 text-[10px] text-[#8e8a83]">
            <p>
              {isPoundOrder
                ? "SATI Atelier (UK/Global) · support@sati.com"
                : "SATI Apparel Pvt. Ltd. (Nepal) · support@sati.com"}
            </p>
            <p className="font-mono">{String(txnId).slice(-12)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Orders Management Table ───────────────────────────────────────────
export function OrdersManagement({ orders }: { orders: Order[] }) {
  const { rate } = useExchangeRate()
  const [allOrders, setAllOrders] = useState<Order[]>(orders)
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [search, setSearch] = useState<string>("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [slipModalOrder, setSlipModalOrder] = useState<Order | null>(null)

  useEffect(() => {
    setAllOrders(orders)
  }, [orders])

  const statuses = ["All", "pending", "confirmed", "shipped", "delivered", "cancelled"]

  const filtered = allOrders.filter((order) => {
    const matchesStatus = statusFilter === "All" || order.status === statusFilter
    const customer = getCustomer(order)
    const q = search.trim().toLowerCase()
    const matchesSearch =
      !q ||
      order.id.toLowerCase().includes(q) ||
      customer.name.toLowerCase().includes(q) ||
      customer.email.toLowerCase().includes(q) ||
      order.items.some((i) => i.name.toLowerCase().includes(q))
    return matchesStatus && matchesSearch
  })

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId)
    try {
      await adminApi.orders.updateStatus(orderId, newStatus as Order["status"])
      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o))
      )
    } catch (err) {
      console.error("Failed to update order status:", err)
      alert(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-6">
      {slipModalOrder && (
        <AdminSlipModal
          order={slipModalOrder}
          onClose={() => setSlipModalOrder(null)}
          rate={rate}
        />
      )}

      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <CardTitle className="font-serif text-2xl font-medium">Orders</CardTitle>
              <Badge variant="outline" className="border-border text-xs gap-1.5 font-normal py-1 px-3">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Market: <span className="font-semibold text-foreground">1 GBP = Rs {rate.toFixed(2)}</span>
              </Badge>
            </div>
            <CardDescription className="mt-1">
              {allOrders.length} total orders · Real-time fulfillment & dual currency tracking
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold capitalize transition-colors ${
                    statusFilter === s
                      ? "bg-white text-black"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID & Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">
                    No customer orders found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order) => {
                  const customer = getCustomer(order)
                  const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })

                  return (
                    <React.Fragment key={order.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      >
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-mono text-xs font-semibold text-foreground">
                              #{order.id.slice(-8).toUpperCase()}
                            </span>
                            <p className="text-[11px] text-muted-foreground">{dateStr}</p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-foreground">{customer.name}</p>
                            {customer.email && (
                              <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                                {customer.email}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {getPaymentBadge(order)}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Package className="size-3.5 text-muted-foreground" />
                            <span className="font-medium">
                              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="font-semibold text-xs text-foreground">
                          {(() => {
                            const isGbpOrder = checkIsPoundOrder(order)
                            const totalGbp = isGbpOrder ? (order.subtotalPound ?? order.subtotal) : order.subtotalPound
                            const totalNpr = isGbpOrder ? null : order.subtotal
                            const dual = getDualAmount({ gbp: totalGbp, npr: totalNpr }, rate)

                            return (
                              <div className="flex flex-col text-xs leading-tight">
                                <span className="font-bold text-foreground">{dual.gbpFormatted}</span>
                                <span className="text-[11px] text-muted-foreground font-medium">{dual.nprFormatted}</span>
                              </div>
                            )
                          })()}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className={ORDER_BADGES[order.status] ?? ""}>
                            {order.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {/* Payment Slip Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSlipModalOrder(order)}
                              className="h-8 rounded-lg px-2.5 text-[11px] font-semibold gap-1.5 border-border hover:bg-muted"
                            >
                              <ReceiptText className="size-3.5 text-[#e94717]" />
                              Slip
                            </Button>

                            {/* Status Select */}
                            <select
                              className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-medium capitalize"
                              value={order.status}
                              onChange={(e) => updateStatus(order.id, e.target.value)}
                              disabled={updating === order.id}
                            >
                              {statuses
                                .filter((s) => s !== "All")
                                .map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                            </select>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                            >
                              {expandedId === order.id ? (
                                <ChevronUp className="size-4" />
                              ) : (
                                <ChevronDown className="size-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Details */}
                      {expandedId === order.id && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/20 p-4">
                            <div className="space-y-4">

                              {/* Items Grid with Real Thumbnails */}
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                  Order Items ({order.items.length})
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                  {order.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs"
                                    >
                                      {item.image ? (
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="size-14 shrink-0 rounded-lg object-cover border border-border bg-muted"
                                        />
                                      ) : (
                                        <div className="size-14 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                                          <Package className="size-5 text-muted-foreground" />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-foreground truncate">
                                          {item.name}
                                        </p>
                                        <div className="mt-0.5 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                                          {item.color && <span>{item.color}</span>}
                                          {item.size && <span>Size {item.size}</span>}
                                        </div>
                                        <div className="mt-1 flex items-center justify-between text-xs">
                                          <span className="text-muted-foreground">Qty: {item.quantity}</span>
                                          {(() => {
                                            const itemGbp = item.poundPrice != null ? item.poundPrice * item.quantity : null
                                            const itemNpr = item.price * item.quantity
                                            const itemDual = getDualAmount({ gbp: itemGbp, npr: itemNpr }, rate)

                                            return (
                                              <div className="text-right leading-tight">
                                                <span className="font-bold text-foreground block">{itemDual.gbpFormatted}</span>
                                                <span className="text-[11px] text-muted-foreground">{itemDual.nprFormatted}</span>
                                              </div>
                                            )
                                          })()}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Order & Payment Summary Bar */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="rounded-xl border border-border bg-card p-3 space-y-1.5 text-xs">
                                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                    Customer & Delivery
                                  </p>
                                  <p className="font-semibold text-foreground">{customer.name}</p>
                                  <p className="text-muted-foreground truncate">{customer.email || "No email"}</p>
                                  {order.phoneNumber && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Phone className="size-3 shrink-0" />
                                      <span>{order.phoneNumber}</span>
                                    </div>
                                  )}
                                  {order.address && (
                                    <div className="flex items-start gap-1 text-muted-foreground">
                                      <MapPin className="size-3 shrink-0 mt-0.5" />
                                      <span className="break-words">{order.address}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="rounded-xl border border-border bg-card p-3 space-y-1 text-xs">
                                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                    Payment Transaction
                                  </p>
                                  <div className="flex items-center gap-1.5">
                                    {getPaymentBadge(order)}
                                    <span className="text-[11px] text-muted-foreground">
                                      {order.payment?.status === "success" ? "Verified" : order.status}
                                    </span>
                                  </div>
                                  <p className="font-mono text-[11px] text-muted-foreground truncate">
                                    Ref: {order.payment?.transactionId || order.payment?.pidx || order.id}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-border bg-card p-3 space-y-1 text-xs">
                                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                    Settlement Total
                                  </p>
                                  {(() => {
                                    const isGbpOrder = checkIsPoundOrder(order)
                                    const totalGbp = isGbpOrder ? (order.subtotalPound ?? order.subtotal) : order.subtotalPound
                                    const totalNpr = isGbpOrder ? null : order.subtotal
                                    const subDual = getDualAmount({ gbp: totalGbp, npr: totalNpr }, rate)

                                    const savGbp = isGbpOrder ? (order.totalSavingsPound ?? order.totalSavings) : order.totalSavingsPound
                                    const savNpr = isGbpOrder ? null : order.totalSavings
                                    const savDual = (order.totalSavings > 0 || (order.totalSavingsPound && order.totalSavingsPound > 0))
                                      ? getDualAmount({ gbp: savGbp, npr: savNpr }, rate)
                                      : null

                                    return (
                                      <>
                                        <div className="flex justify-between items-baseline">
                                          <span className="text-muted-foreground">Subtotal:</span>
                                          <div className="text-right leading-tight">
                                            <span className="font-bold text-foreground block">{subDual.gbpFormatted}</span>
                                            <span className="text-[11px] text-muted-foreground">{subDual.nprFormatted}</span>
                                          </div>
                                        </div>
                                        {savDual && (
                                          <div className="flex justify-between items-baseline text-emerald-400">
                                            <span>Savings:</span>
                                            <div className="text-right leading-tight">
                                              <span className="font-semibold block">−{savDual.gbpFormatted}</span>
                                              <span className="text-[10px]">−{savDual.nprFormatted}</span>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    )
                                  })()}
                                  <div className="pt-1 flex justify-end">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => setSlipModalOrder(order)}
                                      className="h-7 text-xs rounded-lg gap-1"
                                    >
                                      <ReceiptText className="size-3 text-[#e94717]" />
                                      View Official Slip
                                    </Button>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}