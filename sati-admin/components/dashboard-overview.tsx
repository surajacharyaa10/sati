"use client"

import {
  Package,
  ShoppingBag,
  Banknote,
  Coins,
  ArrowLeftRight,
  Users,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AdminSummary } from "@/lib/admin-api"
import { useExchangeRate, getDualAmount, formatPound, formatRupee } from "@/lib/currency"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const chartConfig = {
  revenue: { label: "Revenue (Rs)", color: "#e94717" },
}

export function DashboardOverview({ summary }: { summary: AdminSummary | null }) {
  const { rate } = useExchangeRate()

  if (!summary) {
    return <div className="p-8 text-sm text-muted-foreground">Loading dashboard analytics…</div>
  }

  // Combined overall revenue dynamically converted using market exchange rate
  // If order was GBP, convert to NPR; if NPR, convert to GBP
  const poundRev = summary.revenuePound ?? 0
  const poundSavings = summary.savingsPound ?? 0
  const nprRev = summary.revenue ?? 0
  const nprSavings = summary.savings ?? 0

  // Total equivalent converted using live market rate
  const totalCombinedNpr = nprRev + (poundRev * rate)
  const totalCombinedGbp = poundRev + (rate > 0 ? nprRev / rate : 0)

  const statCards = [
    {
      title: "Total Revenue (Rs)",
      value: `Rs ${Math.round(nprRev).toLocaleString("en-NP")}`,
      desc: `Customer savings: Rs ${Math.round(nprSavings).toLocaleString("en-NP")}`,
      icon: Banknote,
      trend: "+12.4% from last month",
    },
    {
      title: "Total Revenue (£ / GBP)",
      value: `£${poundRev.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
      desc: `Customer savings: £${poundSavings.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
      icon: Coins,
      trend: "Pound direct settlements",
    },
    {
      title: "Overall Revenue (Dual)",
      isDual: true,
      topValue: `£${totalCombinedGbp.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      downValue: `Rs ${Math.round(totalCombinedNpr).toLocaleString("en-NP")}`,
      desc: `Live Market: 1 GBP ≈ Rs ${rate.toFixed(2)}`,
      icon: ArrowLeftRight,
      trend: "Combined dynamic total",
    },
    {
      title: "Active Orders",
      value: summary.orders.toString(),
      desc: `${summary.statusCounts["pending"] ?? 0} pending fulfillment`,
      icon: ShoppingBag,
      trend: "+8 new today",
    },
    {
      title: "Active Catalog",
      value: summary.products.toString(),
      desc: "Sets, Dresses, Outerwear, Tops",
      icon: Package,
      trend: "100% in stock",
    },
    {
      title: "Registered Customers",
      value: summary.customers.toString(),
      desc: "Active accounts",
      icon: Users,
      trend: "+4 this week",
    },
  ]

  // Mock revenue distribution for chart based on top products
  const chartData = summary.topProducts.map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 12) + "…" : p.name,
    revenue: p.revenue,
    units: p.units,
  }))

  return (
    <div className="space-y-8">
      {/* Metrics Row - 6 Cards in 2 rows of 3 or responsive */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="rounded-2xl border-border bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#e94717]/10 text-[#e94717]">
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                {card.isDual ? (
                  <div className="space-y-0.5">
                    <div className="font-serif text-2xl font-bold tracking-tight text-foreground">
                      {card.topValue}
                    </div>
                    <div className="text-sm font-semibold text-[#e94717]">
                      {card.downValue}
                    </div>
                  </div>
                ) : (
                  <div className="font-serif text-3xl font-medium tracking-tight text-foreground">{card.value}</div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{card.desc}</p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="size-3" />
                  <span>{card.trend}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts and Top Sellers */}
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="rounded-2xl border-border bg-card lg:col-span-4 shadow-xs">
          <CardHeader>
            <CardTitle className="font-serif text-xl font-medium">Revenue by Top Products</CardTitle>
            <CardDescription>Top revenue generators across SATI categories</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] pt-4">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No order sales data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#171512", borderRadius: "8px", color: "#fff", border: "none" }}
                    formatter={(value: unknown) => [`Rs ${Number(value ?? 0).toLocaleString("en-NP")}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#e94717" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card lg:col-span-3 shadow-xs">
          <CardHeader>
            <CardTitle className="font-serif text-xl font-medium">Top Performing Items</CardTitle>
            <CardDescription>Ranked by total units sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.topProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No sales recorded yet.</p>
              ) : (
                summary.topProducts.map((p, idx) => (
                  <div key={p.name} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.units} units sold</p>
                      </div>
                    </div>
                    <div className="text-right font-semibold text-sm text-foreground">
                      Rs {p.revenue.toLocaleString("en-NP")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-serif text-xl font-medium">Recent Orders</CardTitle>
            <CardDescription>Latest customer checkouts and fulfillment statuses</CardDescription>
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
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    No orders placed yet.
                  </TableCell>
                </TableRow>
              ) : (
                summary.recentOrders.map((order) => {
                  const dual = getDualAmount(
                    {
                      gbp: order.currency === "GBP" ? (order.subtotalPound ?? order.subtotal) : order.subtotalPound,
                      npr: order.currency === "GBP" ? null : order.subtotal,
                    },
                    rate,
                  )

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs font-semibold">{order.id.slice(-8)}</TableCell>
                      <TableCell>
                        <div className="text-xs font-medium">
                          {order.items.length} {order.items.length === 1 ? "item" : "items"} ({order.items[0]?.name}
                          {order.items.length > 1 ? ` +${order.items.length - 1}` : ""})
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        <div className="flex flex-col text-xs leading-tight">
                          <span className="font-bold text-foreground">{dual.gbpFormatted}</span>
                          <span className="text-[11px] text-muted-foreground font-medium">{dual.nprFormatted}</span>
                        </div>
                      </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize ${
                          order.status === "confirmed" || order.status === "delivered"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
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
