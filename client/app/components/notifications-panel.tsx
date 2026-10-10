"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Bell, X, Info, Tag, AlertTriangle, ChevronRight } from "lucide-react"
import { apiBaseUrl } from "@/lib/api"

// ─── types ──────────────────────────────────────────────────────────────────

type NotificationType = "info" | "promo" | "alert"

type Notification = {
  _id: string
  title: string
  text: string
  image?: string
  imageAlt?: string
  type: NotificationType
  active: boolean
  createdAt?: string
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const TYPE_META: Record<NotificationType, { icon: React.ElementType; accent: string; badge: string }> = {
  info:  { icon: Info,          accent: "#3b82f6", badge: "bg-blue-100 text-blue-700 border-blue-200" },
  promo: { icon: Tag,           accent: "#10b981", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  alert: { icon: AlertTriangle, accent: "#f59e0b", badge: "bg-amber-100 text-amber-700 border-amber-200" },
}

const SEEN_KEY = "sati_seen_notifications"

function getSeenIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]"))
  } catch {
    return new Set()
  }
}

function markSeen(ids: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids))
  } catch {}
}

function formatDate(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7)  return `${diffDays} days ago`
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

// ─── panel ───────────────────────────────────────────────────────────────────

export function NotificationsPanel() {
  const [open, setOpen]                     = useState(false)
  const [notifications, setNotifications]   = useState<Notification[]>([])
  const [loading, setLoading]               = useState(false)
  const [unseenCount, setUnseenCount]       = useState(0)
  const [expandedId, setExpandedId]         = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBaseUrl}/api/notifications`, { credentials: "include" })
      if (!res.ok) return
      const data: Notification[] = await res.json()
      setNotifications(data)
      const seen = getSeenIds()
      setUnseenCount(data.filter(n => !seen.has(n._id)).length)
    } catch {
      // Silently fail — notifications are non-critical
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Close panel when clicking outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Mark all seen when panel opens
  useEffect(() => {
    if (!open || notifications.length === 0) return
    const ids = notifications.map(n => n._id)
    markSeen(ids)
    setUnseenCount(0)
  }, [open, notifications])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open])

  return (
    <div className="relative">
      {/* Bell trigger */}
      <button
        ref={triggerRef}
        id="notifications-bell"
        type="button"
        aria-label={`Notifications${unseenCount > 0 ? `, ${unseenCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(v => !v)}
        className="relative inline-flex size-9 items-center justify-center rounded-full text-[#171512] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e94717]"
      >
        <Bell aria-hidden="true" className="size-[19px]" />
        {unseenCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 flex size-[15px] items-center justify-center rounded-full bg-[#e94717] text-[9px] font-bold text-white"
          >
            {unseenCount > 9 ? "9+" : unseenCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-black/10 bg-[#f7f3eb] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/10 bg-[#f7f3eb] px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-[#e94717]" />
              <h2 className="text-sm font-bold text-[#171512]">Notifications</h2>
              {notifications.length > 0 && (
                <span className="rounded-full bg-[#e94717]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#e94717]">
                  {notifications.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
              className="rounded-full p-1.5 text-[#8b867e] transition hover:bg-black/5 hover:text-[#171512]"
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-[#e94717]/30 border-t-[#e94717]" />
                <p className="text-xs text-[#8b867e]">Loading…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14 px-4 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-[#e94717]/10 text-[#e94717]">
                  <Bell size={22} />
                </div>
                <p className="text-sm font-semibold text-[#171512]">All caught up!</p>
                <p className="text-xs text-[#8b867e]">No new notifications right now.</p>
              </div>
            ) : (
              <ul className="divide-y divide-black/5">
                {notifications.map((n) => {
                  const meta  = TYPE_META[n.type]
                  const Icon  = meta.icon
                  const expanded = expandedId === n._id

                  return (
                    <li key={n._id}>
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : n._id)}
                        className="w-full text-left transition hover:bg-black/[0.03]"
                      >
                        {/* Image */}
                        {n.image && expanded && (
                          <div className="relative h-32 w-full overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={n.image}
                              alt={n.imageAlt || n.title}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#f7f3eb]/80 via-transparent" />
                          </div>
                        )}

                        <div className="flex gap-3 px-4 py-3.5">
                          {/* Icon bubble */}
                          <div
                            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full"
                            style={{ background: `${meta.accent}18` }}
                          >
                            <Icon size={15} style={{ color: meta.accent }} />
                          </div>

                          {/* Body */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[13px] font-semibold leading-tight text-[#171512]">
                                {n.title}
                              </p>
                              <ChevronRight
                                size={14}
                                className={`mt-0.5 shrink-0 text-[#8b867e] transition-transform ${expanded ? "rotate-90" : ""}`}
                              />
                            </div>

                            {/* Short preview when collapsed */}
                            {!expanded && (
                              <p className="mt-1 line-clamp-2 text-xs text-[#706c66]">{n.text}</p>
                            )}

                            {/* Full text when expanded */}
                            {expanded && (
                              <p className="mt-1.5 text-xs leading-relaxed text-[#706c66]">{n.text}</p>
                            )}

                            <div className="mt-1.5 flex items-center gap-2">
                              <span className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${meta.badge}`}>
                                <Icon size={7} /> {n.type}
                              </span>
                              <span className="text-[10px] text-[#a09a92]">{formatDate(n.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-black/10 bg-[#f7f3eb]/80 px-4 py-2.5 text-center">
              <p className="text-[11px] text-[#a09a92]">
                {notifications.length} notification{notifications.length !== 1 ? "s" : ""} · Tap to expand
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
