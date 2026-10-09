"use client"

import { useState } from "react"
import { Database, Zap, Server, HardDrive, Wifi, WifiOff, AlertCircle, Settings2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { adminApi } from "@/lib/admin-api"

export function SettingsScreen() {
  const [checking, setChecking] = useState(false)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function checkConnection() {
    setChecking(true)
    setError(null)
    try {
      await adminApi.products.list()
      setConnected(true)
    } catch {
      setConnected(false)
    } finally {
      setChecking(false)
    }
  }

  const stats = [
    { label: "API Server", value: "http://localhost:5001", icon: Server },
    { label: "Database", value: "MongoDB", icon: Database },
    { label: "Auth", value: "JWT + httpOnly cookie", icon: Settings2 },
    { label: "Next Admin Panel", value: "Running on :3000", icon: Zap },
  ]

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardHeader>
          <CardTitle className="font-serif text-2xl font-medium">Store Settings</CardTitle>
          <CardDescription>Manage connections, endpoints, and status checks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{s.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">{s.value}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800">
                    Connected
                  </Badge>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Button onClick={checkConnection} disabled={checking} className="h-10 rounded-xl bg-[#171512] hover:bg-[#2a2723]">
              {checking ? (
                <span className="flex items-center gap-2">
                  <Wifi className="size-4 animate-pulse" /> Checking…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Wifi className="size-4" /> Check Connectivity
                </span>
              )}
            </Button>
            {connected === false && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <WifiOff className="size-4" />
                <span className="text-xs font-medium">Cannot reach backend API</span>
              </div>
            )}
            {connected === true && (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Wifi className="size-4" />
                <span className="text-xs font-medium">Backend reachable</span>
              </div>
            )}
          </div>
          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardHeader>
          <CardTitle className="font-serif text-xl font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Clear product cache</p>
                <p className="text-xs text-muted-foreground">Resets stale inventory data</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-8 rounded-lg">
              Clear
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <Zap className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Seed new arrivals</p>
                <p className="text-xs text-muted-foreground">Re-seed catalog from default data</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-8 rounded-lg">
              Seed
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
