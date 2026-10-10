"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  MessageSquare,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
  Clock,
  Package,
  User,
  Mail,
  Inbox,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Circle,
  Filter,
} from "lucide-react"
import { adminApi, type ChatSession, type ChatMsg, type Product } from "@/lib/admin-api"

// ─── helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso?: string) {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function formatTime(iso?: string) {
  if (!iso) return ""
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function unreadCount(session: ChatSession) {
  return session.messages.filter((m) => m.sender === "customer" && !m.readByCustomer).length
}

// ─── Session list item ────────────────────────────────────────────────────────

function SessionItem({
  session,
  isActive,
  onClick,
}: {
  session: ChatSession
  isActive: boolean
  onClick: () => void
}) {
  const lastMsg = session.messages.at(-1)
  const unread = unreadCount(session)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition ${
        isActive
          ? "border-[#e94717]/50 bg-[#e94717]/10"
          : "border-white/10 bg-zinc-900 hover:border-white/20 hover:bg-zinc-800"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {unread > 0 && (
            <span className="flex size-2 shrink-0 rounded-full bg-[#e94717] animate-pulse" />
          )}
          <span className={`truncate text-sm font-semibold ${isActive ? "text-white" : "text-zinc-200"}`}>
            {session.customerName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {unread > 0 && (
            <span className="rounded-full bg-[#e94717] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
          <span className="text-[10px] text-zinc-500">{timeAgo(session.lastActivity)}</span>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-1.5">
        <Package className="size-3 shrink-0 text-zinc-600" />
        <span className="truncate text-[11px] text-zinc-500">{session.productName}</span>
      </div>

      {lastMsg && (
        <p className="mt-1.5 line-clamp-2 text-xs text-zinc-400 leading-relaxed">
          {lastMsg.sender === "admin" ? (
            <span className="text-emerald-400">You: </span>
          ) : null}
          {lastMsg.text}
        </p>
      )}

      <div className="mt-1.5 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
            session.status === "active"
              ? "border-emerald-700/50 bg-emerald-950/40 text-emerald-400"
              : "border-zinc-700/50 bg-zinc-800 text-zinc-500"
          }`}
        >
          <Circle className={`size-1.5 fill-current ${session.status === "active" ? "text-emerald-400" : "text-zinc-500"}`} />
          {session.status === "active" ? "Active" : "Closed"}
        </span>
      </div>
    </button>
  )
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: ChatMsg }) {
  const isAdmin = msg.sender === "admin"
  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
        isAdmin
          ? "rounded-tr-xs bg-[#e94717] text-white"
          : "rounded-tl-xs border border-white/10 bg-zinc-800 text-zinc-100"
      }`}>
        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
        <p className={`mt-1 text-right text-[10px] ${isAdmin ? "text-white/60" : "text-zinc-500"}`}>
          {formatTime(msg.createdAt)}
        </p>
      </div>
    </div>
  )
}

// ─── Chat thread pane ─────────────────────────────────────────────────────────

function ChatThread({
  session,
  onReply,
  onStatusChange,
  onDelete,
  onBack,
}: {
  session: ChatSession
  onReply: (id: string, text: string) => Promise<void>
  onStatusChange: (id: string, status: ChatSession["status"]) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onBack: () => void
}) {
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)
  const [error, setError] = useState("")
  const [product, setProduct] = useState<Product | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [showSpecs, setShowSpecs] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [session.messages.length])

  // Fetch product specifications so admin can look and answer customer queries accurately
  useEffect(() => {
    let active = true
    if (!session.productId) {
      setProduct(null)
      return
    }
    setLoadingProduct(true)
    adminApi.products
      .get(session.productId)
      .then((p) => {
        if (active && p) setProduct(p)
      })
      .catch(async () => {
        // Fallback: search in list by ID or name
        try {
          const list = await adminApi.products.list()
          const found = list.find(
            (p) =>
              p.id === session.productId ||
              (p as any)._id === session.productId ||
              p.name.toLowerCase() === session.productName?.toLowerCase()
          )
          if (active && found) setProduct(found)
        } catch {
          // ignore
        }
      })
      .finally(() => {
        if (active) setLoadingProduct(false)
      })

    return () => {
      active = false
    }
  }, [session.productId, session.productName])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setError("")
    try {
      await onReply(session._id, text)
      setInput("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setSending(false)
    }
  }

  async function handleToggleStatus() {
    setStatusChanging(true)
    try {
      const nextStatus = session.status === "active" ? "closed" : "active"
      await onStatusChange(session._id, nextStatus)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update chat status")
    } finally {
      setStatusChanging(false)
    }
  }

  function handleInsertText(snippet: string) {
    setInput((prev) => (prev ? `${prev} ${snippet}` : snippet))
  }

  return (
    <div className="flex h-full flex-col">
      {/* Thread header */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-zinc-950 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white transition lg:hidden"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white uppercase">
              {session.customerName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{session.customerName}</p>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1 truncate">
                  <Package className="size-3 text-[#e94717]" /> {session.productName}
                </span>
                <span className="text-zinc-700">·</span>
                <a href={`mailto:${session.customerEmail}`} className="text-blue-400 hover:underline truncate">
                  {session.customerEmail}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Header action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Prominent Close / Reopen Chat Button */}
          {session.status === "active" ? (
            <button
              type="button"
              disabled={statusChanging}
              onClick={handleToggleStatus}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500 hover:text-white transition shadow-xs disabled:opacity-50"
              title="Finish and close this chat"
            >
              {statusChanging ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <XCircle className="size-3.5" />
              )}
              Close Chat
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                Closed
              </span>
              <button
                type="button"
                disabled={statusChanging}
                onClick={handleToggleStatus}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white transition shadow-xs disabled:opacity-50"
                title="Reopen this chat"
              >
                {statusChanging ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                Reopen
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => onDelete(session._id)}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-950/40 hover:text-red-400 transition"
            title="Delete session"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Product Specifications & Details Reference Bar ── */}
      <div className="border-b border-white/10 bg-zinc-900 px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Thumbnail */}
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-800">
              {product?.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-500">
                  <Package className="size-5" />
                </div>
              )}
            </div>

            {/* Product Title & Quick Specs */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white truncate">
                  {product?.name || session.productName}
                </h4>
                {product?.label && (
                  <span className="rounded-full bg-[#e94717]/20 border border-[#e94717]/40 px-1.5 py-0.2 text-[9px] font-semibold text-[#e94717]">
                    {product.label}
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                {product ? (
                  <>
                    <span className="font-semibold text-white">₹{product.price}</span>
                    {product.originalPrice && (
                      <del className="text-zinc-500 text-[10px]">₹{product.originalPrice}</del>
                    )}
                    <span className="text-zinc-600">·</span>
                    <span>{product.audience} {product.category}</span>
                    <span className="text-zinc-600">·</span>
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        product.stock > 5
                          ? "text-emerald-400"
                          : product.stock > 0
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      <Circle className="size-1.5 fill-current" />
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </span>
                  </>
                ) : loadingProduct ? (
                  <span className="text-[10px] text-zinc-500 animate-pulse">Loading product details…</span>
                ) : (
                  <span className="text-[10px] text-zinc-500 font-mono">ID: {session.productId}</span>
                )}
              </div>
            </div>
          </div>

          {/* Details toggle button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowSpecs((v) => !v)}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition"
            >
              {showSpecs ? (
                <>Hide Specs <ChevronUp className="size-3" /></>
              ) : (
                <>Product Details <ChevronDown className="size-3" /></>
              )}
            </button>

            <a
              href={`http://localhost:3000/product/${session.productId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-400 hover:bg-white/10 hover:text-white transition"
              title="Open product page on store"
            >
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>

        {/* Expanded Specs Drawer */}
        {showSpecs && (
          <div className="mt-3 border-t border-white/10 pt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
            {/* Fabric & Fit */}
            <div className="rounded-lg bg-zinc-800/60 p-2.5 border border-white/5 space-y-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Fabric & Fit</p>
              <p className="text-zinc-200">
                <span className="text-zinc-400">Material:</span> {product?.material || "Standard"}
              </p>
              <p className="text-zinc-200">
                <span className="text-zinc-400">Fit:</span> {product?.fit || "Regular"}
              </p>
            </div>

            {/* Available Sizes (Click to insert into reply) */}
            <div className="rounded-lg bg-zinc-800/60 p-2.5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Available Sizes</p>
                <span className="text-[9px] text-zinc-500">Click to insert</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {product?.sizes && product.sizes.length > 0 ? (
                  product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleInsertText(`Size ${s}`)}
                      className="rounded border border-white/10 bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-200 hover:border-[#e94717] hover:text-[#e94717] transition"
                      title={`Insert "Size ${s}" into reply`}
                    >
                      {s}
                    </button>
                  ))
                ) : (
                  <span className="text-zinc-500 text-[11px]">No sizes configured</span>
                )}
              </div>
            </div>

            {/* Available Colors (Click to insert into reply) */}
            <div className="rounded-lg bg-zinc-800/60 p-2.5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Colors</p>
                <span className="text-[9px] text-zinc-500">Click to insert</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {product?.colors && product.colors.length > 0 ? (
                  product.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleInsertText(c)}
                      className="rounded border border-white/10 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-300 hover:border-[#e94717] hover:text-[#e94717] transition"
                      title={`Insert "${c}" into reply`}
                    >
                      {c}
                    </button>
                  ))
                ) : (
                  <span className="text-zinc-500 text-[11px]">No colors configured</span>
                )}
              </div>
            </div>

            {/* Description & Details */}
            {(product?.description || product?.details) && (
              <div className="sm:col-span-2 lg:col-span-3 rounded-lg bg-zinc-800/40 p-2.5 border border-white/5">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-1">Description & Details</p>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  {product.description || product.details}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {session.messages.map((msg) => (
          <ChatBubble key={msg._id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input / Closed state */}
      <div className="border-t border-white/10 bg-zinc-950 p-4">
        {session.status === "closed" ? (
          <div className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs text-zinc-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              This chat is finished and closed.
            </span>
            <button
              type="button"
              disabled={statusChanging}
              onClick={handleToggleStatus}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className="size-3" />
              Reopen Chat
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live conversation with {session.customerName}
              </span>
              <button
                type="button"
                disabled={statusChanging}
                onClick={handleToggleStatus}
                className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-red-400 hover:underline transition"
              >
                <XCircle className="size-3 text-red-400" />
                Finish & Close Chat
              </button>
            </div>
            <form onSubmit={handleSend} className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend(e)
                  }
                }}
                placeholder="Type a reply… (Enter to send, Shift+Enter for newline)"
                rows={2}
                className="flex-1 resize-none rounded-xl border border-white/10 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#e94717]/50 focus:ring-1 focus:ring-[#e94717]/20"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e94717] text-white transition hover:bg-[#d03e12] disabled:opacity-40"
              >
                {sending ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </form>
          </div>
        )}
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        <p className="mt-1.5 text-[10px] text-zinc-600">
          Customer will see your reply in real-time via the chat widget on the product page.
        </p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LiveChatManagement() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const status = statusFilter === "all" ? undefined : statusFilter
      const data = await adminApi.chatSessions.list(status)
      setSessions(data)
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [statusFilter])

  // initial load
  useEffect(() => { load() }, [load])

  // polling every 4s
  useEffect(() => {
    pollRef.current = setInterval(() => load(true), 4000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [load])

  const selected = sessions.find((s) => s._id === selectedId) ?? null

  const filtered = sessions.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.customerName.toLowerCase().includes(q) ||
      s.customerEmail.toLowerCase().includes(q) ||
      s.productName.toLowerCase().includes(q) ||
      s.messages.some((m) => m.text.toLowerCase().includes(q))
    )
  })

  const activeCount = sessions.filter((s) => s.status === "active").length
  const unreadTotal = sessions.reduce((acc, s) => acc + unreadCount(s), 0)

  async function handleReply(id: string, text: string) {
    const updated = await adminApi.chatSessions.reply(id, text)
    setSessions((prev) => prev.map((s) => (s._id === id ? updated : s)))
  }

  async function handleStatusChange(id: string, status: ChatSession["status"]) {
    const updated = await adminApi.chatSessions.setStatus(id, status)
    setSessions((prev) => prev.map((s) => (s._id === id ? updated : s)))
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this chat session permanently?")) return
    await adminApi.chatSessions.remove(id)
    setSessions((prev) => prev.filter((s) => s._id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-semibold text-white flex items-center gap-2">
            <MessageSquare className="size-5 text-[#e94717]" />
            Live Chat
            {unreadTotal > 0 && (
              <span className="ml-1 rounded-full bg-[#e94717] px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadTotal} unread
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            {activeCount} active session{activeCount !== 1 ? "s" : ""} · {sessions.length} total
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-700/50 bg-red-950/40 p-3 text-sm text-red-300">{error}</div>
      )}

      {/* Two-pane layout */}
      <div className="flex flex-1 overflow-hidden rounded-xl border border-white/10">
        {/* Left: session list */}
        <div className={`flex w-full flex-col border-r border-white/10 bg-zinc-900/50 lg:w-80 xl:w-96 ${selected ? "hidden lg:flex" : "flex"}`}>
          {/* Filters */}
          <div className="space-y-2 border-b border-white/10 p-3">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2">
              <Search className="size-4 text-zinc-500 shrink-0" />
              <input
                type="text"
                placeholder="Search chats…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 p-1">
              {(["all", "active", "closed"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition capitalize ${
                    statusFilter === f ? "bg-[#e94717] text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto space-y-2 p-3">
            {loading && filtered.length === 0 ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-800" />
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Inbox className="size-10 text-zinc-700" />
                <p className="mt-3 text-sm text-zinc-500">No chat sessions yet</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Sessions appear when customers start a live chat on the product page
                </p>
              </div>
            ) : (
              filtered.map((s) => (
                <SessionItem
                  key={s._id}
                  session={s}
                  isActive={s._id === selectedId}
                  onClick={() => setSelectedId(s._id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: chat thread */}
        <div className={`flex-1 overflow-hidden ${selected ? "flex" : "hidden lg:flex"} flex-col bg-zinc-950`}>
          {selected ? (
            <ChatThread
              session={selected}
              onReply={handleReply}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-10">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-900 border border-white/10">
                <MessageSquare className="size-7 text-zinc-600" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-400">Select a conversation</h3>
              <p className="mt-1 text-sm text-zinc-600 max-w-xs">
                Pick a chat session from the list to see messages and reply to the customer in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
