"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Store,
  LogOut,
  Sparkles,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { adminAuth } from "@/lib/admin-api"

type NavItem = {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
}

const items: NavItem[] = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
  { id: "products", title: "Products", icon: Package },
  { id: "orders", title: "Orders", icon: ShoppingBag },
  { id: "customers", title: "Customers", icon: Users },
  { id: "settings", title: "Store Settings", icon: Settings },
]

export function AdminSidebar({
  activeTab,
  setActiveTab,
}: {
  activeTab: string
  setActiveTab: (tab: string) => void
}) {
  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className="h-16 px-6 flex items-center border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e94717] text-white font-serif text-lg font-bold">
            S
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-serif text-base font-semibold tracking-tight">SATI Admin</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Management</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={isActive}
                  onClick={() => setActiveTab(item.id)}
                  className={`h-11 rounded-lg px-3.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#e94717] text-white hover:bg-[#d03e12]"
                      : "text-zinc-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-white/10">
        <div className="flex flex-col gap-2 group-data-[collapsible=icon]:hidden">
          <div className="rounded-xl bg-zinc-900/60 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <Sparkles className="size-3.5 text-[#e94717]" />
              <span>SATI Store v1.0</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">Connected to live backend database.</p>
          </div>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="flex h-10 w-full items-center justify-between rounded-lg px-3 text-xs font-semibold text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Store className="size-3.5" /> View Storefront
            </span>
            <span className="text-[10px] rounded bg-white/10 px-1.5 py-0.5">3000</span>
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
