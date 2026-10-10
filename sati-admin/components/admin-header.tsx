"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, Bell, ShieldCheck, LogOut } from "lucide-react"
import { adminAuth } from "@/lib/admin-api"

export function AdminHeader({
  title,
  onRefresh,
  isRefreshing,
}: {
  title: string
  onRefresh: () => void
  isRefreshing: boolean
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <h1 className="font-serif text-xl font-medium tracking-tight text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-9 gap-2 rounded-lg text-xs font-semibold"
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-medium">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          <span>Admin Master</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => adminAuth.signOut().then(() => (window.location.replace("/login")))}
          className="h-9 gap-2 rounded-lg text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-3.5" /> Sign out
        </Button>
      </div>
    </header>
  )
}
