"use client"

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Copy,
  Check,
  Pencil,
  Camera,
  ShieldCheck,
  Briefcase,
  User,
  Sliders,
  LogOut,
  X,
  ChevronRight,
  Info,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  UserRound,
  CheckCircle2,
  Building2,
  MapPin,
  Sparkles,
  IdCard,
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react"
import { Navbar } from "@/app/components/navbar"
import { Button } from "@/components/ui/button"
import { apiBaseUrl, authApi } from "@/lib/api"
import { useAuth } from "@/app/components/auth-provider"

// Deterministic Member ID generator modeled after Alibaba (e.g. np19101073181exvz)
function getMemberId(userId?: string) {
  if (!userId) return "np19101073181exvz"
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0
  }
  const positive = Math.abs(hash).toString().padEnd(11, "0").slice(0, 11)
  return `np${positive}exvz`
}

function maskEmail(emailStr: string, masked = true) {
  if (!masked) return emailStr
  const [local, domain] = emailStr.split("@")
  if (!local || !domain) return emailStr
  const visible = local.slice(0, Math.min(3, local.length))
  return `${visible}***@${domain}`
}

export default function AccountPage() {
  const router = useRouter()
  const { user, hasCheckedSession, signOut, refresh } = useAuth()

  // Top Tabs
  const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile")
  const [previewProfile, setPreviewProfile] = useState(false)
  const [showMaskedEmail, setShowMaskedEmail] = useState(true)

  // Feedback & Copy states
  const [copiedId, setCopiedId] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [successToast, setSuccessToast] = useState("")
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editSection, setEditSection] = useState<"all" | "basic" | "business">("all")
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")

  // Form Fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [address, setAddress] = useState("")
  const [country, setCountry] = useState("Nepal")

  // Photo state
  const [photo, setPhoto] = useState<File | undefined>()
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)

  // Modal dialog states for settings sub-pages
  const [activeSettingsModal, setActiveSettingsModal] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  function openPasswordModal() {
    setActiveSettingsModal("password")
    setPasswordSuccess(false)
    setPasswordError("")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  async function handleUpdatePassword(e?: FormEvent) {
    if (e) e.preventDefault()
    setPasswordError("")
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters")
      return
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordError("Confirm password does not match")
      return
    }

    setIsUpdatingPassword(true)
    try {
      await authApi.changePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
      })
      setPasswordSuccess(true)
      setNewPassword("")
      setCurrentPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password"
      setPasswordError(msg)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  function clearPhotoPreview() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    setPhotoPreview(null)
  }

  // Load and sync user data
  useEffect(() => {
    if (!hasCheckedSession || !user) return

    setName(user.name)
    setEmail(user.email)

    // Load persisted local profile details
    try {
      const storedPhone = localStorage.getItem(`sati_profile_phone_${user.id}`)
      if (storedPhone) setPhone(storedPhone)

      const storedBizType = localStorage.getItem(`sati_profile_biz_${user.id}`)
      if (storedBizType) setBusinessType(storedBizType)

      const storedCompany = localStorage.getItem(`sati_profile_company_${user.id}`)
      setCompanyName(storedCompany || user.name)

      const storedAddress = localStorage.getItem(`sati_profile_address_${user.id}`)
      if (storedAddress) setAddress(storedAddress)
    } catch {
      // ignore
    }
  }, [hasCheckedSession, user])

  function handleCopyMemberId() {
    const id = getMemberId(user?.id)
    navigator.clipboard.writeText(id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedPhoto = event.currentTarget.files?.[0]
    if (!selectedPhoto) return

    clearPhotoPreview()
    const previewUrl = URL.createObjectURL(selectedPhoto)
    previewUrlRef.current = previewUrl
    setPhotoPreview(previewUrl)
    setPhoto(selectedPhoto)
    setRemovePhoto(false)
  }

  function handleRemovePhoto() {
    clearPhotoPreview()
    setPhoto(undefined)
    setRemovePhoto(true)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function openEditModal(section: "all" | "basic" | "business" = "all") {
    setEditSection(section)
    setFormError("")
    setIsEditModalOpen(true)
  }

  async function handleSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSaving(true)
    setFormError("")

    try {
      if (user) {
        const { user: updatedUser } = await authApi.updateProfile({
          name: name.trim(),
          email: email.trim(),
          ...(photo ? { photo } : {}),
          ...(removePhoto ? { removePhoto: true } : {}),
        })

        // Save supplementary profile attributes
        localStorage.setItem(`sati_profile_phone_${user.id}`, phone.trim())
        localStorage.setItem(`sati_profile_biz_${user.id}`, businessType.trim())
        localStorage.setItem(`sati_profile_company_${user.id}`, (companyName || name).trim())
        localStorage.setItem(`sati_profile_address_${user.id}`, address.trim())

        await refresh()
        setName(updatedUser.name)
        setEmail(updatedUser.email)
        clearPhotoPreview()
        setPhoto(undefined)
        setRemovePhoto(false)
        if (fileInputRef.current) fileInputRef.current.value = ""

        setIsEditModalOpen(false)
        setSuccessToast("Profile details updated successfully")
        setTimeout(() => setSuccessToast(""), 3500)
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update profile.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await signOut()
      router.replace("/login")
      router.refresh()
    } catch {
      setIsSigningOut(false)
    }
  }

  const memberId = getMemberId(user?.id)
  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "S"

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#171512]">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Toast alert */}
        {successToast && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 shadow-sm animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {successToast}
            </span>
            <button
              type="button"
              onClick={() => setSuccessToast("")}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* View Switcher / Sub-navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-3">
          <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-xs border border-black/5">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeTab === "profile"
                  ? "bg-[#171512] text-white shadow-xs"
                  : "text-[#706c66] hover:text-[#171512]"
              }`}
            >
              <User className="size-3.5" />
              Profile Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeTab === "settings"
                  ? "bg-[#171512] text-white shadow-xs"
                  : "text-[#706c66] hover:text-[#171512]"
              }`}
            >
              <Sliders className="size-3.5" />
              Account Settings
            </button>
          </div>

          {/* Toggle on right: Preview profile (from Image 1) */}
          {activeTab === "profile" && (
            <div className="flex items-center gap-2 text-xs text-[#706c66]">
              <button
                type="button"
                onClick={() => setPreviewProfile(!previewProfile)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  previewProfile ? "bg-[#e94717]" : "bg-zinc-300"
                }`}
                role="switch"
                aria-checked={previewProfile}
              >
                <span
                  className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    previewProfile ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="font-medium text-[#171512]">Preview profile</span>
              <span title="View your profile as suppliers and SATI stylists see it">
                <Info className="size-3.5 text-zinc-400 hover:text-zinc-600" />
              </span>
            </div>
          )}
        </div>

        {/* ─── STATE 1: LOADING ─── */}
        {!hasCheckedSession ? (
          <div className="space-y-4 py-12">
            <div className="h-44 w-full animate-pulse rounded-2xl bg-white" />
            <div className="h-44 w-full animate-pulse rounded-2xl bg-white" />
          </div>
        ) : !user ? (
          /* ─── STATE 2: NOT LOGGED IN ─── */
          <div className="rounded-2xl border border-black/10 bg-white p-10 text-center shadow-xs">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f7f3eb] text-[#e94717]">
              <User className="size-7" />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-semibold">Sign in to view your profile</h2>
            <p className="mt-2 text-xs text-[#706c66] max-w-sm mx-auto">
              Access your personal details, verified status, member ID, and security preferences.
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#171512] px-6 text-xs font-semibold text-white hover:bg-[#e94717] transition"
              >
                Sign in to SATI
              </Link>
            </div>
          </div>
        ) : activeTab === "profile" ? (
          /* ══════════════════════════════════════════════════════════════════════ */
          /* ─── TAB 1: PROFILE OVERVIEW (Faithful to Screenshot 1) ───────────── */
          /* ══════════════════════════════════════════════════════════════════════ */
          <div className="space-y-5">
            {/* Page Title */}
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold tracking-tight text-[#171512]">Profile</h1>
              {previewProfile && (
                <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                  Public Preview Mode
                </span>
              )}
            </div>

            {/* CARD 1: Basic Information */}
            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-xs">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-black/8 pb-4">
                <div className="flex items-center gap-2">
                  <IdCard className="size-4 text-[#e94717]" />
                  <h2 className="text-sm font-bold text-[#171512]">Basic information</h2>
                </div>
                {!previewProfile && (
                  <button
                    type="button"
                    onClick={() => openEditModal("basic")}
                    className="flex size-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-[#171512] transition"
                    title="Edit basic information"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                )}
              </div>

              {/* User Avatar + Summary Meta */}
              <div className="mt-5 flex flex-wrap items-center gap-5">
                {/* Avatar Circle */}
                <div className="relative flex size-18 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#faece7] text-2xl font-bold text-[#e94717] shadow-xs">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl.startsWith("http") ? user.avatarUrl : `${apiBaseUrl}${user.avatarUrl}`}
                      alt={user.name}
                      width={72}
                      height={72}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : (
                    <span>{initial}</span>
                  )}
                  {!previewProfile && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full bg-white text-[#171512] shadow-md border border-black/10 hover:bg-[#e94717] hover:text-white transition"
                      title="Update avatar"
                    >
                      <Camera className="size-2.5" />
                    </button>
                  )}
                </div>

                {/* Name, Member ID, Country, Joined */}
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-base font-bold text-[#171512] tracking-wide uppercase">
                    {user.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#706c66]">
                    <span className="flex items-center gap-1.5 font-medium">
                      Member ID <span className="font-mono text-[#171512]">{memberId}</span>
                      <button
                        type="button"
                        onClick={handleCopyMemberId}
                        className="text-zinc-400 hover:text-[#e94717] transition p-0.5"
                        title="Copy Member ID"
                      >
                        {copiedId ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#706c66]">
                    <span className="flex items-center gap-1.5">
                      Country of registration:{" "}
                      <span className="inline-flex items-center gap-1 font-semibold text-[#171512]">
                        <span className="text-sm">🇳🇵</span> NP
                      </span>
                      <span title="Verified registered location in Nepal">
                        <Info className="size-3 text-zinc-400" />
                      </span>
                    </span>
                    <span className="text-zinc-300">·</span>
                    <span>Year joined <strong className="text-[#171512]">2026</strong></span>
                  </div>
                </div>
              </div>

              {/* Rows: Email & Phone Number */}
              <div className="mt-6 divide-y divide-black/8 border-t border-black/8 pt-2">
                {/* Email row */}
                <div className="flex flex-wrap items-center justify-between gap-2 py-3.5">
                  <span className="text-xs font-medium text-[#706c66]">Email</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#171512]">
                      {maskEmail(user.email, showMaskedEmail)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMaskedEmail(!showMaskedEmail)}
                      className="text-zinc-400 hover:text-zinc-600"
                      title={showMaskedEmail ? "Reveal email" : "Mask email"}
                    >
                      {showMaskedEmail ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                    </button>
                    <span className="inline-flex items-center rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      Verified
                    </span>
                  </div>
                </div>

                {/* Phone row */}
                <div className="flex flex-wrap items-center justify-between gap-2 py-3.5">
                  <span className="text-xs font-medium text-[#706c66]">Phone number</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#171512]">
                      {phone || <span className="text-zinc-400">No phone number</span>}
                    </span>
                    {!previewProfile && !phone && (
                      <button
                        type="button"
                        onClick={() => openEditModal("basic")}
                        className="text-xs font-medium text-[#e94717] hover:underline"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: Business information */}
            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-xs">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/8 pb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="size-4 text-[#e94717]" />
                  <h2 className="text-sm font-bold text-[#171512]">Business information</h2>
                </div>
                {!previewProfile && (
                  <button
                    type="button"
                    onClick={() => openEditModal("business")}
                    className="flex size-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-[#171512] transition"
                    title="Edit business information"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Dismissible Alert Banner (from Screenshot 1) */}
              {!bannerDismissed && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-[#f0f6ff] p-3.5 text-xs text-[#204a87]">
                  <ShieldCheck className="size-4 shrink-0 text-[#2563eb] mt-0.5" />
                  <p className="flex-1 leading-relaxed">
                    Complete this section to let stylists and suppliers know you better. You&apos;ll get more tailored styling, quotes, and communicate more efficiently.
                  </p>
                  <button
                    type="button"
                    onClick={() => setBannerDismissed(true)}
                    className="text-blue-400 hover:text-blue-700"
                    title="Dismiss notice"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}

              {/* Rows: Business type, Company name, Address */}
              <div className="mt-4 divide-y divide-black/8">
                <div className="flex flex-wrap items-center justify-between gap-2 py-3.5">
                  <span className="text-xs font-medium text-[#706c66]">Business type</span>
                  <span className="text-xs font-medium text-[#171512]">
                    {businessType || <span className="text-zinc-400">Incomplete</span>}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 py-3.5">
                  <span className="text-xs font-medium text-[#706c66]">Company name</span>
                  <span className="text-xs font-semibold text-[#171512]">
                    {companyName || user.name}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 py-3.5">
                  <span className="text-xs font-medium text-[#706c66]">Address</span>
                  <span className="text-xs font-medium text-[#171512]">
                    {address || <span className="text-zinc-400">Incomplete</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════════════════ */
          /* ─── TAB 2: ACCOUNT SETTINGS (Faithful to Screenshot 2) ───────────── */
          /* ══════════════════════════════════════════════════════════════════════ */
          <div className="space-y-6">
            {/* Top User Card (from Screenshot 2) */}
            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-6">
                {/* Left: Avatar + Details */}
                <div className="flex items-center gap-5">
                  <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#faece7] text-2xl font-bold text-[#e94717] shadow-xs">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl.startsWith("http") ? user.avatarUrl : `${apiBaseUrl}${user.avatarUrl}`}
                        alt={user.name}
                        width={80}
                        height={80}
                        unoptimized
                        className="size-full object-cover"
                      />
                    ) : (
                      <span>{initial}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full bg-white text-[#171512] shadow-md border border-black/10 hover:bg-[#e94717] hover:text-white transition"
                      title="Upload photo"
                    >
                      <Camera className="size-3" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-lg font-bold uppercase tracking-wide text-[#171512]">
                      {user.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-[#706c66]">
                      <span>Email</span>
                      <span className="font-mono text-[#171512]">{maskEmail(user.email)}</span>
                      <button
                        type="button"
                        onClick={() => openEditModal("basic")}
                        className="text-zinc-400 hover:text-[#171512]"
                        title="Edit email"
                      >
                        <Pencil className="size-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#706c66]">
                      <span>Member ID</span>
                      <span className="font-mono text-[#171512]">{memberId}</span>
                      <button
                        type="button"
                        onClick={handleCopyMemberId}
                        className="text-zinc-400 hover:text-[#e94717]"
                        title="Copy Member ID"
                      >
                        {copiedId ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: [Edit my profile] & Sign out */}
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => openEditModal("all")}
                    className="rounded-full bg-[#171512] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#e94717] transition"
                  >
                    Edit my profile
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="text-xs font-semibold text-[#706c66] hover:text-red-600 transition"
                  >
                    {isSigningOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              </div>
            </div>

            {/* Grid of 3 Settings Cards (from Screenshot 2) */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* CARD 1: Account information */}
              <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-black/8 pb-3 text-xs font-bold uppercase tracking-wider text-[#171512]">
                  <User className="size-4 text-[#e94717]" />
                  <span>Account information</span>
                </div>
                <div className="mt-2 divide-y divide-black/5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className="flex w-full items-center justify-between py-3 text-xs text-[#171512] hover:text-[#e94717] transition group text-left"
                  >
                    <span>My profile</span>
                    <ChevronRight className="size-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal("business")}
                    className="flex w-full items-center justify-between py-3 text-xs text-[#171512] hover:text-[#e94717] transition group text-left"
                  >
                    <span>Member profile</span>
                    <ChevronRight className="size-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSettingsModal("connected")}
                    className="flex w-full items-center justify-between py-3 text-xs text-[#171512] hover:text-[#e94717] transition group text-left"
                  >
                    <span>Connected accounts</span>
                    <div className="flex items-center gap-1.5">
                      <span className="flex size-4 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold text-red-600">
                        G
                      </span>
                      <ChevronRight className="size-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal("business")}
                    className="flex w-full items-center justify-between py-3 text-xs text-[#171512] hover:text-[#e94717] transition group text-left"
                  >
                    <span>Tax & Delivery information</span>
                    <ChevronRight className="size-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </div>

              {/* CARD 2: Account security */}
              <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-black/8 pb-3 text-xs font-bold uppercase tracking-wider text-[#171512]">
                  <Lock className="size-4 text-[#e94717]" />
                  <span>Account security</span>
                </div>
                <div className="mt-2 divide-y divide-black/5">
                  <button
                    type="button"
                    onClick={openPasswordModal}
                    className="flex w-full items-center justify-between py-3 text-xs text-[#171512] hover:text-[#e94717] transition group text-left"
                  >
                    <span>Change password</span>
                    <ChevronRight className="size-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal("basic")}
                    className="flex w-full items-center justify-between py-3 text-xs text-[#171512] hover:text-[#e94717] transition group text-left"
                  >
                    <span>Change email</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-zinc-500">{maskEmail(user.email)}</span>
                      <ChevronRight className="size-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal("basic")}
                    className="flex w-full items-center justify-between py-3 text-xs text-[#171512] hover:text-[#e94717] transition group text-left"
                  >
                    <span>Change phone number</span>
                    <ChevronRight className="size-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSettingsModal("delete")}
                    className="flex w-full items-center justify-between py-3 text-xs text-red-600 hover:text-red-700 transition group text-left"
                  >
                    <span>Delete account</span>
                    <ChevronRight className="size-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </div>

              {/* CARD 3: Preferences */}
              <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-xs md:col-span-2">
                <div className="flex items-center gap-2 border-b border-black/8 pb-3 text-xs font-bold uppercase tracking-wider text-[#171512]">
                  <Sliders className="size-4 text-[#e94717]" />
                  <span>Preferences</span>
                </div>
                <div className="mt-2 divide-y divide-black/5">
                  <button
                    type="button"
                    onClick={() => setActiveSettingsModal("preferences")}
                    className="flex w-full items-center justify-between py-3 text-xs text-[#171512] hover:text-[#e94717] transition group text-left"
                  >
                    <span>Privacy settings</span>
                    <ChevronRight className="size-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSettingsModal("preferences")}
                    className="flex w-full items-center justify-between py-3 text-xs text-[#171512] hover:text-[#e94717] transition group text-left"
                  >
                    <span>Email preferences & notifications</span>
                    <ChevronRight className="size-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSettingsModal("preferences")}
                    className="flex w-full items-center justify-between py-3 text-xs text-[#171512] hover:text-[#e94717] transition group text-left"
                  >
                    <span>Ads preferences & personal styling recommendations</span>
                    <ChevronRight className="size-3.5 text-zinc-400 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden File Input for Avatar Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ─── EDIT PROFILE MODAL (Rich in-place editor) ───────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
            <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-black/10 pb-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#171512]">
                    Edit Profile & Details
                  </h3>
                  <p className="mt-1 text-xs text-[#706c66]">
                    Update your personal and business information.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-black transition"
                >
                  <X className="size-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
                {/* Photo row */}
                <div>
                  <label className="block text-xs font-semibold text-[#171512] mb-2">
                    Profile photo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#faece7] text-xl font-bold text-[#e94717] border border-black/10">
                      {photoPreview || (!removePhoto && user?.avatarUrl) ? (
                        <Image
                          src={photoPreview ?? (user?.avatarUrl?.startsWith("http") ? user.avatarUrl : `${apiBaseUrl}${user?.avatarUrl}`)}
                          alt="Avatar preview"
                          width={64}
                          height={64}
                          unoptimized
                          className="size-full object-cover"
                        />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full text-xs font-semibold"
                      >
                        <Camera className="mr-1.5 size-3.5" />
                        Upload new photo
                      </Button>
                      {(photoPreview || (!removePhoto && user?.avatarUrl)) && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleRemovePhoto}
                          className="rounded-full text-xs text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 1: Basic Information */}
                <div className="rounded-xl border border-black/10 bg-[#fbf9f5] p-4 space-y-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#e94717]">
                    Basic Information
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#171512] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-xs outline-none focus:border-[#e94717]"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#171512] mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-xs outline-none focus:border-[#e94717]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#171512] mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +977 9800000000"
                        className="h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-xs outline-none focus:border-[#e94717]"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Business Information */}
                <div className="rounded-xl border border-black/10 bg-[#fbf9f5] p-4 space-y-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#e94717]">
                    Business & Purchasing Information
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#171512] mb-1">
                        Business Type
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-xs outline-none focus:border-[#e94717]"
                      >
                        <option value="">Select business type</option>
                        <option value="Individual Shopper">Individual Shopper</option>
                        <option value="Fashion Boutique">Fashion Boutique</option>
                        <option value="Wholesale Buyer">Wholesale Buyer</option>
                        <option value="Stylist / Agency">Stylist / Agency</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#171512] mb-1">
                        Company / Brand Name
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Acharya Trading"
                        className="h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-xs outline-none focus:border-[#e94717]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171512] mb-1">
                      Address / City
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Kathmandu, Nepal"
                      className="h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-xs outline-none focus:border-[#e94717]"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="rounded-full border border-black/15 px-5 py-2 text-xs font-semibold text-[#171512] hover:bg-zinc-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-full bg-[#171512] px-6 py-2 text-xs font-semibold text-white hover:bg-[#e94717] transition disabled:opacity-50"
                  >
                    {isSaving ? "Saving changes…" : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── SETTINGS MODAL DIALOGS (Password, Connected, etc.) ─── */}
        {activeSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
            <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h4 className="font-serif text-lg font-bold text-[#171512] capitalize">
                  {activeSettingsModal === "password"
                    ? "Change Password"
                    : activeSettingsModal === "connected"
                    ? "Connected Accounts"
                    : activeSettingsModal === "delete"
                    ? "Delete Account"
                    : "Preferences"}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSettingsModal(null)
                    setPasswordSuccess(false)
                    setNewPassword("")
                  }}
                  className="rounded-full p-1 text-zinc-400 hover:text-black"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="py-4 text-xs leading-relaxed text-[#706c66]">
                {activeSettingsModal === "password" && (
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    {passwordSuccess ? (
                      <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                        <div className="flex items-center gap-2 font-semibold">
                          <CheckCircle2 className="size-4 text-emerald-600" />
                          <span>Password updated successfully!</span>
                        </div>
                        <p className="text-[11px] text-emerald-700">
                          Your account password has been changed. Use your new password the next time you sign in.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveSettingsModal(null)}
                          className="mt-2 rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <>
                        {passwordError && (
                          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] font-medium text-red-700">
                            {passwordError}
                          </div>
                        )}

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-[#171512]">
                            Current Password <span className="font-normal text-zinc-400">(optional if newly registered)</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="Enter current password"
                              className="h-10 w-full rounded-lg border border-black/15 bg-transparent pl-3 pr-10 text-xs outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#171512] transition"
                              aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                            >
                              {showCurrentPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-[#171512]">
                            New Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="At least 6 characters"
                              required
                              minLength={6}
                              className="h-10 w-full rounded-lg border border-black/15 bg-transparent pl-3 pr-10 text-xs outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#171512] transition"
                              aria-label={showNewPassword ? "Hide password" : "Show password"}
                            >
                              {showNewPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-[#171512]">
                            Confirm New Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Re-enter new password"
                              required
                              minLength={6}
                              className="h-10 w-full rounded-lg border border-black/15 bg-transparent pl-3 pr-10 text-xs outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#171512] transition"
                              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isUpdatingPassword}
                            className="w-full rounded-full bg-[#171512] py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#e94717] transition disabled:opacity-50"
                          >
                            {isUpdatingPassword ? "Updating password…" : "Save New Password"}
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                )}

                {activeSettingsModal === "connected" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-red-100 font-bold text-red-600 text-xs">
                          G
                        </span>
                        <div>
                          <p className="font-semibold text-[#171512]">Google Account</p>
                          <p className="text-[10px] text-zinc-400">{user?.email}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Connected
                      </span>
                    </div>
                  </div>
                )}

                {activeSettingsModal === "delete" && (
                  <div className="space-y-3">
                    <p className="text-red-600 font-medium">
                      Are you sure you want to delete your SATI account?
                    </p>
                    <p className="text-[11px] text-[#706c66]">
                      This will permanently remove your orders, wishlist, and session data.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        alert("Please contact SATI support to complete account deactivation.")
                        setActiveSettingsModal(null)
                      }}
                      className="w-full rounded-full bg-red-600 py-2.5 font-semibold text-white hover:bg-red-700 transition"
                    >
                      Request Deletion
                    </button>
                  </div>
                )}

                {activeSettingsModal === "preferences" && (
                  <div className="space-y-3">
                    <p>Customize how SATI contacts you:</p>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded accent-[#e94717]" />
                      <span>Receive seasonal collection & journal updates</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded accent-[#e94717]" />
                      <span>Order status & shipping notifications via email</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded accent-[#e94717]" />
                      <span>Personalized styling recommendations</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setActiveSettingsModal(null)}
                  className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}