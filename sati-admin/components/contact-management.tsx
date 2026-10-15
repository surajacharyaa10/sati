"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Share2,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Inbox,
  User,
} from "lucide-react"
import { adminApi, type SiteContactInfo, type ContactMessageItem } from "@/lib/admin-api"

export function ContactManagement() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const [activeSubTab, setActiveSubTab] = useState<"settings" | "messages">("settings")

  // Form state
  const [formData, setFormData] = useState<SiteContactInfo>({
    address: "",
    phone: "",
    gmail: "",
    availabilityStatus: "",
    availabilityDescription: "",
    socialLinks: {
      instagram: "",
      facebook: "",
      tiktok: "",
      whatsapp: "",
      pinterest: "",
      youtube: "",
    },
  })

  // Messages state
  const [messages, setMessages] = useState<ContactMessageItem[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messageSearch, setMessageSearch] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    setStatusMessage(null)
    try {
      const data = await adminApi.contact.get()
      if (data) {
        setFormData({
          address: data.address || "",
          phone: data.phone || "",
          gmail: data.gmail || "",
          availabilityStatus: data.availabilityStatus || "",
          availabilityDescription: data.availabilityDescription || "",
          socialLinks: {
            instagram: data.socialLinks?.instagram || "",
            facebook: data.socialLinks?.facebook || "",
            tiktok: data.socialLinks?.tiktok || "",
            whatsapp: data.socialLinks?.whatsapp || "",
            pinterest: data.socialLinks?.pinterest || "",
            youtube: data.socialLinks?.youtube || "",
          },
        })
      }
    } catch (err) {
      console.error("Failed to load contact info:", err)
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load contact info",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async () => {
    setLoadingMessages(true)
    try {
      const list = await adminApi.contact.messages.list()
      setMessages(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error("Failed to load contact messages:", err)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    loadMessages()
  }, [loadData, loadMessages])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name.startsWith("social_")) {
      const platform = name.replace("social_", "")
      setFormData((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [platform]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    setStatusMessage(null)

    try {
      const updated = await adminApi.contact.update(formData)
      if (updated) {
        setFormData({
          address: updated.address || "",
          phone: updated.phone || "",
          gmail: updated.gmail || "",
          availabilityStatus: updated.availabilityStatus || "",
          availabilityDescription: updated.availabilityDescription || "",
          socialLinks: {
            instagram: updated.socialLinks?.instagram || "",
            facebook: updated.socialLinks?.facebook || "",
            tiktok: updated.socialLinks?.tiktok || "",
            whatsapp: updated.socialLinks?.whatsapp || "",
            pinterest: updated.socialLinks?.pinterest || "",
            youtube: updated.socialLinks?.youtube || "",
          },
        })
      }
      setStatusMessage({
        type: "success",
        text: "Contact & social media details updated successfully!",
      })
      setTimeout(() => {
        setStatusMessage(null)
      }, 4000)
    } catch (err) {
      console.error("Save error:", err)
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save changes",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleMessageStatus = async (id: string, status: ContactMessageItem["status"]) => {
    try {
      const updated = await adminApi.contact.messages.updateStatus(id, status)
      setMessages((prev) => prev.map((m) => (m._id === id ? updated : m)))
    } catch (err) {
      toast.error("Failed to update status: " + (err instanceof Error ? err.message : "Error"))
    }
  }

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this message?")) return
    try {
      await adminApi.contact.messages.remove(id)
      setMessages((prev) => prev.filter((m) => m._id !== id))
    } catch (err) {
      toast.error("Failed to delete message: " + (err instanceof Error ? err.message : "Error"))
    }
  }

  const unreadMessagesCount = messages.filter((m) => m.status === "unread").length

  const filteredMessages = messages.filter((m) => {
    if (!messageSearch.trim()) return true
    const q = messageSearch.toLowerCase()
    return (
      m.from_name.toLowerCase().includes(q) ||
      m.from_email.toLowerCase().includes(q) ||
      m.from_phone.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <RefreshCw className="size-8 animate-spin text-[#e94717]" />
        <p className="text-sm text-zinc-400">Loading contact and social media settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-white">
              Contact & Social Media
            </h1>
            <span className="rounded-full bg-[#e94717]/10 px-2.5 py-0.5 text-xs font-semibold text-[#e94717] border border-[#e94717]/30">
              Live DB
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Control the phone number, Gmail address, physical address, and social media handles
            displayed in the store footer and contact screen.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              loadData()
              loadMessages()
            }}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <RefreshCw className={`size-3.5 ${saving ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {activeSubTab === "settings" && (
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#e94717] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#d03d12] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`flex items-center gap-3 rounded-xl p-4 text-sm ${
            statusMessage.type === "success"
              ? "border border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
              : "border border-red-500/30 bg-red-950/40 text-red-300"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-red-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveSubTab("settings")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeSubTab === "settings"
              ? "border-[#e94717] text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Share2 className="size-3.5" />
          Contact & Social Links
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("messages")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeSubTab === "messages"
              ? "border-[#e94717] text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Inbox className="size-3.5" />
          Customer Messages
          {unreadMessagesCount > 0 && (
            <span className="rounded-full bg-[#e94717] px-1.5 py-0.2 text-[10px] font-bold text-white">
              {unreadMessagesCount}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === "settings" ? (
        <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Info - 2 cols */}
          <div className="space-y-6 lg:col-span-2">
            {/* Direct Contact Card */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#e94717]/10 text-[#e94717]">
                  <Phone className="size-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Atelier Contact Channels</h2>
                  <p className="text-xs text-zinc-400">
                    Direct phone and official Gmail for client inquiries & appointments
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 size-4 text-zinc-500" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+977 9801475272"
                      required
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#e94717] focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Appears on the contact page & footer
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    Official Gmail / Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 size-4 text-zinc-500" />
                    <input
                      type="email"
                      name="gmail"
                      value={formData.gmail}
                      onChange={handleInputChange}
                      placeholder="surajacharya239@gmail.com"
                      required
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#e94717] focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Receives contact form submissions & notifications
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    Physical Studio / Atelier Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 size-4 text-zinc-500" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Thamel 327, Kathmandu, Nepal"
                      required
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#e94717] focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Used for customer directions and in the contact details card
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media Links Card */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Share2 className="size-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Social Media Links</h2>
                    <p className="text-xs text-zinc-400">
                      These links are saved to the database and shown in the client footer and contact screen
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Instagram */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    name="social_instagram"
                    value={formData.socialLinks.instagram}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/sati_atelier"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {/* Facebook */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    name="social_facebook"
                    value={formData.socialLinks.facebook}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/sati.atelier"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {/* TikTok */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    TikTok Profile URL
                  </label>
                  <input
                    type="url"
                    name="social_tiktok"
                    value={formData.socialLinks.tiktok}
                    onChange={handleInputChange}
                    placeholder="https://tiktok.com/@sati_atelier"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    WhatsApp Number or wa.me Link
                  </label>
                  <input
                    type="text"
                    name="social_whatsapp"
                    value={formData.socialLinks.whatsapp}
                    onChange={handleInputChange}
                    placeholder="+9779801475272 or https://wa.me/9779801475272"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {/* Pinterest */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    Pinterest Board URL
                  </label>
                  <input
                    type="url"
                    name="social_pinterest"
                    value={formData.socialLinks.pinterest}
                    onChange={handleInputChange}
                    placeholder="https://pinterest.com/sati_atelier"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {/* YouTube */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    YouTube Channel URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="social_youtube"
                    value={formData.socialLinks.youtube}
                    onChange={handleInputChange}
                    placeholder="https://youtube.com/@sati_atelier"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Preview & Quick Actions */}
          <div className="space-y-6">
            {/* Live Store Preview Card */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
                Live Storefront Preview
              </h3>

              {/* Preview card resembling Contact Page */}
              <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-black/80 to-zinc-900/80 p-5 shadow-lg backdrop-blur-md">
                <div className="space-y-2.5 text-xs text-zinc-300">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="size-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{formData.address || "Address not set"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="size-3.5 text-[#e94717] shrink-0" />
                    <span className="truncate">{formData.phone || "Phone not set"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="size-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{formData.gmail || "Email not set"}</span>
                  </div>
                </div>

                {/* Social badges preview */}
                <div className="mt-4 border-t border-zinc-800/80 pt-3">
                  <p className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider mb-2">
                    Active Social Links
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(formData.socialLinks).map(([k, v]) => {
                      if (!v) return null
                      return (
                        <span
                          key={k}
                          className="rounded-md bg-zinc-800/90 px-2 py-0.5 text-[10px] font-medium text-zinc-300 capitalize border border-zinc-700/50"
                        >
                          {k}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#e94717] py-3 text-xs font-semibold text-white shadow-md transition-all hover:bg-[#d03d12] disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Saving to Database...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Save All Changes
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-zinc-500">
                  Updates take effect immediately on the store website.
                </p>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Messages Inbox Tab */
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search messages by name, email, phone..."
                value={messageSearch}
                onChange={(e) => setMessageSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 pl-9 text-xs text-white placeholder-zinc-500 focus:border-[#e94717] focus:outline-none"
              />
              <User className="absolute left-3 top-2.5 size-3.5 text-zinc-500" />
            </div>

            <div className="text-xs text-zinc-400">
              Total Messages: <span className="font-semibold text-white">{messages.length}</span> (
              {unreadMessagesCount} unread)
            </div>
          </div>

          {loadingMessages ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <RefreshCw className="size-6 animate-spin text-[#e94717]" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
              <Inbox className="size-10 text-zinc-600 mb-2" />
              <p className="text-sm font-medium text-zinc-300">No contact messages found</p>
              <p className="text-xs text-zinc-500 mt-1">
                Submissions from the store contact form will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((msg) => (
                <div
                  key={msg._id}
                  className={`rounded-2xl border p-5 transition-all ${
                    msg.status === "unread"
                      ? "border-[#e94717]/40 bg-zinc-950/90"
                      : "border-zinc-800/80 bg-zinc-950/40"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{msg.from_name}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            msg.status === "unread"
                              ? "bg-[#e94717]/20 text-[#e94717] border border-[#e94717]/30"
                              : msg.status === "replied"
                              ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/50"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {msg.status}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                        <a
                          href={`mailto:${msg.from_email}`}
                          className="flex items-center gap-1 text-cyan-400 hover:underline"
                        >
                          <Mail className="size-3" />
                          {msg.from_email}
                        </a>
                        {msg.from_phone && (
                          <a
                            href={`tel:${msg.from_phone}`}
                            className="flex items-center gap-1 text-zinc-300 hover:underline"
                          >
                            <Phone className="size-3 text-[#e94717]" />
                            {msg.from_phone}
                          </a>
                        )}
                        <span className="flex items-center gap-1 text-zinc-500">
                          <Clock className="size-3" />
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.status !== "replied" && (
                        <button
                          type="button"
                          onClick={() => handleMessageStatus(msg._id, "replied")}
                          className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:bg-zinc-800"
                        >
                          Mark Replied
                        </button>
                      )}
                      {msg.status === "unread" && (
                        <button
                          type="button"
                          onClick={() => handleMessageStatus(msg._id, "read")}
                          className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
                        title="Delete message"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Message body */}
                  <div className="mt-3.5 rounded-xl bg-zinc-900/60 p-3.5 text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed border border-zinc-800/60">
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
