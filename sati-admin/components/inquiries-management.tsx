"use client"

import { useCallback, useEffect, useState } from "react"
import {
  MessageSquare,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  ChevronDown,
  Mail,
  Package,
  User,
  CalendarDays,
  Inbox,
} from "lucide-react"
import { adminApi, type Inquiry } from "@/lib/admin-api"

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_META = {
  pending:  { label: "Pending",  color: "text-amber-400",   bg: "bg-amber-950/40 border-amber-700/50",   dot: "bg-amber-400"   },
  reviewed: { label: "Reviewed", color: "text-blue-400",    bg: "bg-blue-950/40 border-blue-700/50",     dot: "bg-blue-400"    },
  resolved: { label: "Resolved", color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-700/50",dot: "bg-emerald-400" },
} as const

function formatDate(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

// ─── card ─────────────────────────────────────────────────────────────────────

function InquiryCard({
  inquiry,
  onStatusChange,
  onDelete,
}: {
  inquiry: Inquiry
  onStatusChange: (id: string, status: Inquiry["status"]) => void
  onDelete: (id: string) => void
}) {
  const meta = STATUS_META[inquiry.status]
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm("Delete this inquiry permanently?")) return
    setDeleting(true)
    onDelete(inquiry._id)
  }

  const nextStatuses = (
    Object.keys(STATUS_META) as Inquiry["status"][]
  ).filter((s) => s !== inquiry.status)

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4 transition hover:border-white/20">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.bg} ${meta.color}`}>
            <span className={`size-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
          <span className="text-[11px] text-zinc-500">{formatDate(inquiry.createdAt)}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Status change dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-white/10 transition"
            >
              Update <ChevronDown className="size-3" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border border-white/10 bg-zinc-800 shadow-xl"
                onMouseLeave={() => setMenuOpen(false)}
              >
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onStatusChange(inquiry._id, s)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white transition first:rounded-t-xl last:rounded-b-xl"
                  >
                    <span className={`size-2 rounded-full ${STATUS_META[s].dot}`} />
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-950/40 hover:text-red-400 transition"
            title="Delete inquiry"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Product & customer info */}
      <div className="mt-3 grid gap-1 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Package className="size-3.5 shrink-0 text-[#e94717]" />
          <span className="font-semibold text-white truncate">{inquiry.productName}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-500 font-mono text-[10px] truncate">{inquiry.productId}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="size-3.5 shrink-0 text-zinc-500" />
          <span className="text-zinc-300">{inquiry.customerName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="size-3.5 shrink-0 text-zinc-500" />
          <a href={`mailto:${inquiry.customerEmail}`} className="text-blue-400 hover:underline">
            {inquiry.customerEmail}
          </a>
        </div>
      </div>

      {/* Message */}
      <div className="mt-3 rounded-lg bg-white/5 p-3 text-xs text-zinc-300 leading-relaxed border border-white/5">
        {inquiry.message}
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

const STATUS_FILTERS: Array<"all" | Inquiry["status"]> = ["all", "pending", "reviewed", "resolved"]

export function InquiriesManagement() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | Inquiry["status"]>("all")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: { status?: string; page?: number; limit?: number } = { page: 1, limit: 100 }
      if (statusFilter !== "all") params.status = statusFilter
      const data = await adminApi.inquiries.list(params)
      setInquiries(data.inquiries)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inquiries")
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(id: string, status: Inquiry["status"]) {
    try {
      const updated = await adminApi.inquiries.updateStatus(id, status)
      setInquiries((prev) => prev.map((i) => i._id === id ? updated : i))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status")
    }
  }

  async function handleDelete(id: string) {
    try {
      await adminApi.inquiries.remove(id)
      setInquiries((prev) => prev.filter((i) => i._id !== id))
      setTotal((t) => t - 1)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const filtered = inquiries.filter((inq) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      inq.customerName.toLowerCase().includes(q) ||
      inq.customerEmail.toLowerCase().includes(q) ||
      inq.productName.toLowerCase().includes(q) ||
      inq.message.toLowerCase().includes(q)
    )
  })

  const pendingCount = inquiries.filter((i) => i.status === "pending").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-semibold text-white flex items-center gap-2">
            <MessageSquare className="size-5 text-[#e94717]" />
            Product Inquiries
            {pendingCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                {pendingCount} pending
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-400">{total} total inquiry{total !== 1 ? "s" : ""} received from customers</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(STATUS_META) as Inquiry["status"][]).map((s) => {
          const count = inquiries.filter((i) => i.status === s).length
          const meta = STATUS_META[s]
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`rounded-xl border p-3 text-left transition ${
                statusFilter === s ? meta.bg : "border-white/10 bg-zinc-900 hover:border-white/20"
              }`}
            >
              <div className={`text-2xl font-bold ${statusFilter === s ? meta.color : "text-white"}`}>{count}</div>
              <div className="mt-0.5 text-xs text-zinc-400">{meta.label}</div>
            </button>
          )
        })}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2">
          <Search className="size-4 text-zinc-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, or product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f as typeof statusFilter)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === f
                  ? "bg-[#e94717] text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {f === "all" ? "All" : STATUS_META[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-700/50 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-20 text-center">
          <Inbox className="size-10 text-zinc-600" />
          <p className="mt-3 text-sm font-medium text-zinc-400">
            {search ? "No inquiries match your search" : "No inquiries yet"}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {search ? "Try a different keyword" : "Customer product inquiries will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((inq) => (
            <InquiryCard
              key={inq._id}
              inquiry={inq}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
