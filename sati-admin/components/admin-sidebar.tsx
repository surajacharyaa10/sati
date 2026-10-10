"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  LogOut,
  Sparkles,
  FileText,
  Bell,
  MessageSquare,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { adminAuth, adminApi } from "@/lib/admin-api"

type NavItem = {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
}

const items: NavItem[] = [
  { id: "dashboard",     title: "Dashboard",       icon: LayoutDashboard },
  { id: "products",      title: "Products",         icon: Package },
  { id: "orders",        title: "Orders",           icon: ShoppingBag },
  { id: "customers",     title: "Customers",        icon: Users },
  { id: "liveChat",      title: "Live Chat",         icon: MessageSquare },
  { id: "journal",       title: "Journal",          icon: FileText },
  { id: "notifications", title: "Notifications",    icon: Bell },
]

export function AdminSidebar({
  activeTab,
  setActiveTab,
  activeChatCount: externalCount,
}: {
  activeTab: string
  setActiveTab: (tab: string) => void
  activeChatCount?: number
}) {
  const [internalCount, setInternalCount] = React.useState<number>(0)
  const activeChatCount = externalCount !== undefined ? externalCount : internalCount

  React.useEffect(() => {
    let cancelled = false
    async function loadActiveCount() {
      try {
        const active = await adminApi.chatSessions.list("active")
        if (!cancelled) {
          setInternalCount(active.length)
        }
      } catch {
        // Silently ignore background poll errors
      }
    }

    loadActiveCount()
    const timer = setInterval(loadActiveCount, 4000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return (
    <Sidebar collapsible="none" className="sticky top-0 h-svh w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
      <SidebarHeader className="h-16 px-6 flex items-center border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e94717] text-white font-serif text-lg font-bold shadow-sm">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-base font-semibold tracking-tight text-white">SATI Admin</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Management</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 px-3 py-4">
        <SidebarMenu className="space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            const isChat = item.id === "liveChat"
            const showChatBadge = isChat && activeChatCount > 0

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
                  <span className="truncate flex-1 text-left">{item.title}</span>

                  {showChatBadge && (
                    <span
                      className={`ml-auto flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold transition-all ${
                        isActive
                          ? "bg-white text-[#e94717] shadow-xs"
                          : "bg-[#e94717] text-white shadow-[0_0_10px_rgba(233,71,23,0.5)] animate-pulse"
                      }`}
                    >
                      {activeChatCount}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

  
    </Sidebar>
  )
}
