"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { DashboardOverview } from "@/components/dashboard-overview"
import { ProductsManagement } from "@/components/products-management"
import { OrdersManagement } from "@/components/orders-management"
import { CustomersManagement } from "@/components/customers-management"
import { SettingsScreen } from "@/components/settings-screen"
import { adminApi, adminAuth } from "@/lib/admin-api"
import type { Product, Order, User } from "@/lib/admin-api"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof adminApi.summary>> | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    setLoadError(null)
    try {
      const [summaryData, productsData, ordersData, usersData] = await Promise.all([
        adminApi.summary(),
        adminApi.products.list(),
        adminApi.orders.list(),
        adminApi.users.list(),
      ])
      setSummary(summaryData)
      setProducts(productsData)
      setOrders(ordersData)
      setUsers(usersData)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load admin data"
      setLoadError(message)
      console.error("Admin data load error:", err)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function checkAuth() {
      try {
        await adminAuth.me()
      } catch {
        if (!cancelled) {
          window.location.replace("/login")
        }
        return
      }
      if (!cancelled) {
        refresh()
      }
    }
    checkAuth()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const titleByTab: Record<string, string> = {
    dashboard: "Dashboard",
    products: "Products",
    orders: "Orders",
    customers: "Customers",
    settings: "Store Settings",
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full flex-col bg-black text-white">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex min-h-svh flex-col lg:pl-(--sidebar-width)">
          <AdminHeader title={titleByTab[activeTab] ?? "SATI Admin"} onRefresh={refresh} isRefreshing={refreshing} />
          <main className="flex-1 overflow-y-auto bg-black p-6">
            {loadError && (
              <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-300">
                <strong>Backend unreachable:</strong> {loadError}
                <p className="mt-1 text-xs text-red-400">Ensure sati backend is running on :5001 with DATABASE_URL configured.</p>
              </div>
            )}
            {activeTab === "dashboard" && <DashboardOverview summary={summary} />}
            {activeTab === "products" && (
              <ProductsManagement products={products} onUpdate={refresh} />
            )}
            {activeTab === "orders" && <OrdersManagement orders={orders} />}
            {activeTab === "customers" && <CustomersManagement users={users} />}
            {activeTab === "settings" && <SettingsScreen />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}