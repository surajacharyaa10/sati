"use client"

import { useEffect, useRef, useState } from "react"
import {
  Bell, Plus, Trash2, Pencil, X, ImagePlus, Upload,
  Info, Tag, AlertTriangle, ToggleLeft, ToggleRight, Search,
} from "lucide-react"
import { adminApi, type Notification } from "@/lib/admin-api"

// ─── helpers ────────────────────────────────────────────────────────────────

const TYPE_META = {
  info:  { label: "Info",  icon: Info,          color: "text-blue-400",   bg: "bg-blue-950/40 border-blue-800/50" },
  promo: { label: "Promo", icon: Tag,            color: "text-emerald-400",bg: "bg-emerald-950/40 border-emerald-800/50" },
  alert: { label: "Alert", icon: AlertTriangle,  color: "text-amber-400",  bg: "bg-amber-950/40 border-amber-800/50" },
} as const

const TYPE_KEYS: Notification["type"][] = ["info", "promo", "alert"]
const FILTER_TYPES: Array<"all" | Notification["type"]> = ["all", "info", "promo", "alert"]

function formatDate(iso?: string) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

// ─── modal ──────────────────────────────────────────────────────────────────

type ModalProps = {
  notification?: Notification | null
  onClose: () => void
  onSaved: () => void
}

function NotificationModal({ notification, onClose, onSaved }: ModalProps) {
  const isEdit = !!notification

  const [title, setTitle]       = useState(notification?.title ?? "")
  const [text, setText]         = useState(notification?.text ?? "")
  const [image, setImage]       = useState(notification?.image ?? "")
  const [imageAlt, setImageAlt] = useState(notification?.imageAlt ?? "")
  const [type, setType]         = useState<Notification["type"]>(notification?.type ?? "info")
  const [active, setActive]     = useState(notification?.active ?? true)

  const [preview, setPreview]     = useState<string | null>(notification?.image || null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError]         = useState("")
  const [loading, setLoading]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { setError("Only image files accepted."); return }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be ≤ 5 MB."); return }
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
    e.target.value = ""
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!title.trim()) { setError("Title is required."); return }
    if (!text.trim())  { setError("Notification text is required."); return }

    setLoading(true)
    try {
      let imageUrl = image
      if (imageFile) {
        const fd = new FormData()
        fd.append("image", imageFile)
        const res = await adminApi.notifications.upload(fd)
        imageUrl = res.url
      }

      const payload = { title: title.trim(), text: text.trim(), image: imageUrl, imageAlt: imageAlt.trim(), type, active }

      if (isEdit) {
        await adminApi.notifications.update(notification!._id, payload)
      } else {
        await adminApi.notifications.create(payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "h-11 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#e94717]"
  const labelCls = "mb-2 block text-sm font-semibold text-white"

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 p-4 py-8 backdrop-blur-[3px] sm:items-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog" aria-modal="true"
        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="font-serif text-xl text-white">{isEdit ? "Edit Notification" : "New Notification"}</h2>
            <p className="mt-0.5 text-xs text-zinc-400">{isEdit ? `Editing "${notification!.title}"` : "Create a new notification for your customers."}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="grid gap-5 p-6">
          <div>
            <label className={labelCls}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New Collection Drop!" maxLength={120} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Notification Text *</label>
            <textarea
              rows={4}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write the notification message here…"
              maxLength={1000}
              className="w-full resize-y rounded-lg border border-white/15 bg-zinc-950 px-3 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#e94717]"
            />
          </div>

          <div>
            <label className={labelCls}>Type</label>
            <div className="flex gap-2">
              {TYPE_KEYS.map((key) => {
                const meta = TYPE_META[key]
                const Icon = meta.icon
                return (
                  <button
                    key={key} type="button" onClick={() => setType(key)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-semibold transition ${
                      type === key
                        ? `${meta.bg} ${meta.color} border-current`
                        : "border-white/15 text-zinc-400 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <Icon size={13} /> {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className={labelCls}>Notification Image <span className="font-normal text-zinc-500">(optional)</span></label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />

            {preview ? (
              <div className="relative mb-3 overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt={imageAlt || "preview"} className="h-40 w-full object-cover" />
                <button
                  type="button" onClick={() => { setPreview(null); setImageFile(null); setImage("") }}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 bg-zinc-950/60 py-8 text-center transition hover:border-[#e94717]"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-[#e94717]/15 text-[#e94717]">
                  <ImagePlus size={20} />
                </div>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <Upload size={14} /> Upload image
                </span>
                <span className="text-xs text-zinc-500">PNG, JPG, WEBP · Max 5 MB</span>
              </button>
            )}

            {(preview || image) && (
              <input
                value={imageAlt}
                onChange={e => setImageAlt(e.target.value)}
                placeholder="Image alt text"
                className={`${inputCls} mt-2`}
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActive(v => !v)}
              className={`transition ${active ? "text-[#e94717]" : "text-zinc-600"}`}
            >
              {active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
            <div>
              <p className="text-sm font-semibold text-white">Publish immediately</p>
              <p className="text-xs text-zinc-500">If off, notification is saved as a draft.</p>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50">
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="rounded-lg bg-[#e94717] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c83b14] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Notification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export function NotificationsManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState("")
  const [filterType, setFilterType]       = useState<"all" | Notification["type"]>("all")
  const [modal, setModal]                 = useState<Notification | null | undefined>(undefined)
  const [deleteId, setDeleteId]           = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function fetchAll() {
    setLoading(true)
    try {
      const data = await adminApi.notifications.list()
      setNotifications(data)
    } catch (err) {
      console.error("Failed to load notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = notifications.filter(n => {
    const q = search.toLowerCase()
    const matchSearch = n.title.toLowerCase().includes(q) || n.text.toLowerCase().includes(q)
    const matchType = filterType === "all" || n.type === filterType
    return matchSearch && matchType
  })

  const counts = {
    total:  notifications.length,
    active: notifications.filter(n => n.active).length,
    info:   notifications.filter(n => n.type === "info").length,
    promo:  notifications.filter(n => n.type === "promo").length,
    alert:  notifications.filter(n => n.type === "alert").length,
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await adminApi.notifications.delete(deleteId)
      await fetchAll()
    } catch (err) {
      console.error("Delete failed:", err)
    } finally {
      setDeleteId(null)
      setDeleteLoading(false)
    }
  }

  async function toggleActive(n: Notification) {
    try {
      await adminApi.notifications.update(n._id, { active: !n.active })
      await fetchAll()
    } catch (err) {
      console.error("Toggle failed:", err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total",  value: counts.total,  color: "text-white" },
          { label: "Active", value: counts.active, color: "text-emerald-400" },
          { label: "Info",   value: counts.info,   color: "text-blue-400" },
          { label: "Promo",  value: counts.promo,  color: "text-emerald-400" },
          { label: "Alert",  value: counts.alert,  color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-zinc-900 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900 shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-serif text-xl font-medium text-white">Notifications</h2>
            <p className="text-sm text-zinc-400">Manage notifications shown to customers on the storefront.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-zinc-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-9 w-44 rounded-lg border border-white/15 bg-zinc-950 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#e94717]"
              />
            </div>
            <button
              onClick={() => setModal(null)}
              className="flex items-center gap-1.5 rounded-xl bg-[#e94717] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c83b14]"
            >
              <Plus size={15} /> New
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto px-5 py-3 sm:px-6">
          {FILTER_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
                filterType === t
                  ? "bg-[#e94717] text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {t === "all" ? "All" : TYPE_META[t].label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="py-20 text-center text-sm text-zinc-500">Loading notifications…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="flex size-14 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
                <Bell size={26} />
              </div>
              <p className="text-sm text-zinc-500">
                {search || filterType !== "all" ? "No notifications match your filters." : "No notifications yet. Create your first one!"}
              </p>
              {!search && filterType === "all" && (
                <button onClick={() => setModal(null)} className="flex items-center gap-1.5 rounded-lg bg-[#e94717] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c83b14]">
                  <Plus size={14} /> Create notification
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(n => {
                const meta = TYPE_META[n.type]
                const Icon = meta.icon
                return (
                  <div
                    key={n._id}
                    className={`relative overflow-hidden rounded-xl border transition ${
                      n.active ? "border-white/10 bg-zinc-950" : "border-white/5 bg-zinc-950/50 opacity-60"
                    }`}
                  >
                    {n.image && (
                      <div className="relative h-36 w-full overflow-hidden bg-zinc-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={n.image} alt={n.imageAlt || n.title} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.bg} ${meta.color}`}>
                          <Icon size={9} /> {meta.label}
                        </span>
                        <span className={`text-[10px] font-semibold ${n.active ? "text-emerald-400" : "text-zinc-600"}`}>
                          {n.active ? "Live" : "Draft"}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{n.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400 line-clamp-2">{n.text}</p>
                      <p className="mt-2 text-[10px] text-zinc-600">{formatDate(n.createdAt)}</p>
                      <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
                        <button
                          onClick={() => toggleActive(n)}
                          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                            n.active
                              ? "border-emerald-800/50 text-emerald-400 hover:bg-emerald-950/30"
                              : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                          }`}
                        >
                          {n.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                          {n.active ? "Active" : "Draft"}
                        </button>
                        <button
                          onClick={() => setModal(n)}
                          className="ml-auto rounded-lg border border-white/10 p-1.5 text-zinc-400 transition hover:border-white/20 hover:text-white"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteId(n._id)}
                          className="rounded-lg border border-red-900/40 p-1.5 text-red-500 transition hover:bg-red-950/40"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal !== undefined && (
        <NotificationModal
          notification={modal}
          onClose={() => setModal(undefined)}
          onSaved={() => { setModal(undefined); fetchAll() }}
        />
      )}

      {/* Delete confirm dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-950/50 text-red-400">
              <Trash2 size={22} />
            </div>
            <h3 className="text-base font-bold text-white">Delete Notification?</h3>
            <p className="mt-2 text-sm text-zinc-400">This action cannot be undone.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-800">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
