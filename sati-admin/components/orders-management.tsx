"use client"

import * as React from "react"
import { useState } from "react"
import { Package, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Order } from "@/lib/admin-api"
import { adminApi } from "@/lib/admin-api"

const ORDER_BADGES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  shipped: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
  cancelled: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900 dark:text-gray-300",
}

export function OrdersManagement({ orders }: { orders: Order[] }) {
  const [allOrders, setAllOrders] = useState<Order[]>(orders)
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const statuses = ["All", "pending", "confirmed", "shipped", "delivered", "cancelled"]
  const filtered =
    statusFilter === "All"
      ? allOrders
      : allOrders.filter((o) => o.status === statusFilter)

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId)
    try {
      // Reconcile status by fetching fresh and re-rendering; real PATCH would hit backend API.
      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o))
      )
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-serif text-2xl font-medium">Orders</CardTitle>
            <CardDescription>Fulfillments and status tracking</CardDescription>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === s
                    ? "bg-[#171512] text-white dark:bg-accent dark:text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    No orders match your filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order) => (
                  <React.Fragment key={order.id}>
                    <TableRow className="cursor-pointer" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                      <TableCell className="font-mono text-xs font-semibold">{order.id.slice(-8)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Package className="size-3.5 text-muted-foreground" />
                          <span className="font-medium">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">₹{order.subtotal.toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ORDER_BADGES[order.status] ?? ""}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            disabled={updating === order.id}
                          >
                            {statuses.filter((s) => s !== "All").map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                            {expandedId === order.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === order.id && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/30">
                          <div className="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
                            {order.items.map((item) => (
                              <div key={item.productId} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                                <div className="size-12 shrink-0 rounded-lg bg-muted" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">SKU: {item.productId}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Qty: {item.quantity} × ₹{item.price}
                                  </p>
                                  <p className="font-semibold text-sm text-foreground mt-1">
                                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order summary</p>
                            <div className="mt-2 flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span className="font-semibold">₹{order.subtotal.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Savings</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{order.totalSavings.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}