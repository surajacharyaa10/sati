"use client"

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowRight, Camera, LogOut, UserRound, X } from "lucide-react"
import { Navbar } from "@/app/components/navbar"
import { Button } from "@/components/ui/button"
import { apiBaseUrl, authApi, type AuthUser } from "@/lib/api"

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [photo, setPhoto] = useState<File | undefined>()
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)

  function clearPhotoPreview() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    setPhotoPreview(null)
  }

  useEffect(() => {
    let isMounted = true

    authApi.currentUser()
      .then(({ user: currentUser }) => {
        if (isMounted) {
          setUser(currentUser)
          setName(currentUser.name)
          setEmail(currentUser.email)
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Unable to load your profile."
          if (message !== "Not signed in") setLoadError(message)
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedPhoto = event.currentTarget.files?.[0]
    if (!selectedPhoto) return

    clearPhotoPreview()
    const previewUrl = URL.createObjectURL(selectedPhoto)
    previewUrlRef.current = previewUrl
    setPhotoPreview(previewUrl)
    setPhoto(selectedPhoto)
    setRemovePhoto(false)
    setSuccessMessage("")
  }

  function handleRemovePhoto() {
    clearPhotoPreview()
    setPhoto(undefined)
    setRemovePhoto(true)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setSuccessMessage("")
  }

  function handleCancelEdits() {
    if (!user) return
    setName(user.name)
    setEmail(user.email)
    clearPhotoPreview()
    setPhoto(undefined)
    setRemovePhoto(false)
    setFormError("")
    setSuccessMessage("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setFormError("")
    setSuccessMessage("")

    try {
      const { user: updatedUser } = await authApi.updateProfile({
        name,
        email,
        ...(photo ? { photo } : {}),
        ...(removePhoto ? { removePhoto: true } : {}),
      })
      setUser(updatedUser)
      setName(updatedUser.name)
      setEmail(updatedUser.email)
      clearPhotoPreview()
      setPhoto(undefined)
      setRemovePhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setSuccessMessage("Your profile has been updated.")
      window.dispatchEvent(new Event("sati:profile-updated"))
      router.refresh()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to update your profile.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true)
    setFormError("")

    try {
      await authApi.signOut()
      router.replace("/login")
      router.refresh()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to sign out.")
      setIsSigningOut(false)
    }
  }

  const initials = user?.name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-[#f7f3eb] text-[#171512]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-14">
        <div className="border-b border-black/10 pb-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#e94717]">
            Your SATI account
          </p>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="font-serif text-4xl leading-none sm:text-5xl">My profile</h1>
              <p className="mt-3 text-sm text-[#706c66]">
                Your details, all in one place.
              </p>
            </div>
            {user && (
              <Button
                type="button"
                variant="outline"
                disabled={isSigningOut}
                onClick={handleSignOut}
                className="h-10 rounded-full border-black/20 bg-transparent px-4 text-xs font-semibold hover:border-[#e94717] hover:text-[#e94717]"
              >
                <LogOut aria-hidden="true" className="mr-2 size-4" />
                {isSigningOut ? "Signing out…" : "Sign out"}
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div role="status" className="py-16 text-sm text-[#706c66]">
            Loading your profile…
          </div>
        ) : loadError ? (
          <div className="py-12" role="alert">
            <p className="text-sm text-red-700">{loadError}</p>
            <Button
              type="button"
              variant="link"
              onClick={() => window.location.reload()}
              className="mt-2 h-auto p-0 text-[#171512]"
            >
              Try again <ArrowRight aria-hidden="true" className="ml-2 size-4" />
            </Button>
          </div>
        ) : user ? (
          <div className="grid gap-12 py-10 lg:grid-cols-[minmax(220px,0.7fr)_2fr] lg:gap-20">
            <section aria-label="Profile summary" className="flex items-start gap-4 lg:flex-col">
              <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-[#e9e1d4] text-2xl font-semibold text-[#171512]">
                {photoPreview || (!removePhoto && user.avatarUrl) ? (
                  <Image
                    src={photoPreview ?? (user.avatarUrl?.startsWith("https://") ? user.avatarUrl : `${apiBaseUrl}${user.avatarUrl}`)}
                    alt="Profile photo"
                    width={96}
                    height={96}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : initials ? (
                  initials
                ) : (
                  <UserRound aria-hidden="true" className="size-8" />
                )}
              </div>
              <div>
                <h2 className="font-serif text-2xl">{user.name}</h2>
                <p className="mt-1 break-all text-sm text-[#706c66]">{user.email}</p>
                <p className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#706c66]">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-[#59805d]" />
                  Account active
                </p>
              </div>
            </section>

            <section aria-labelledby="personal-details-title">
              <div className="flex items-end justify-between border-b border-black/10 pb-4">
                <div>
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#e94717]">
                    Profile
                  </p>
                  <h2 id="personal-details-title" className="font-serif text-2xl">
                    Personal details
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6 pt-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="profile-name" className="mb-2 block text-xs font-semibold text-[#706c66]">
                      Full name
                    </label>
                    <input
                      id="profile-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      maxLength={100}
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="h-11 w-full rounded-md border border-black/15 bg-white/60 px-3 text-sm outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                    />
                  </div>
                  <div>
                    <label htmlFor="profile-email" className="mb-2 block text-xs font-semibold text-[#706c66]">
                      Email address
                    </label>
                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-11 w-full rounded-md border border-black/15 bg-white/60 px-3 text-sm outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-photo" className="mb-2 block text-xs font-semibold text-[#706c66]">
                    Profile photo
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="profile-photo"
                      className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-black/20 px-4 text-xs font-semibold transition-colors hover:border-[#e94717] hover:text-[#e94717]"
                    >
                      <Camera aria-hidden="true" className="size-4" />
                      Choose photo
                    </label>
                    <input
                      ref={fileInputRef}
                      id="profile-photo"
                      name="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="sr-only"
                    />
                    {(user.avatarUrl || photo) && !removePhoto && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex h-10 items-center gap-2 px-2 text-xs font-semibold text-[#706c66] hover:text-[#e94717]"
                      >
                        <X aria-hidden="true" className="size-4" />
                        Remove photo
                      </button>
                    )}
                    {removePhoto && (
                      <button
                        type="button"
                        onClick={() => setRemovePhoto(false)}
                        className="text-xs font-semibold text-[#e94717]"
                      >
                        Undo remove
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[#706c66]">JPEG, PNG, or WebP. Maximum 5 MB.</p>
                </div>

                {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
                {successMessage && <p role="status" className="text-sm text-green-800">{successMessage}</p>}

                <div className="flex flex-wrap gap-3 border-t border-black/10 pt-5">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="h-11 rounded-full bg-[#171512] px-6 text-xs font-semibold text-white hover:bg-[#e94717]"
                  >
                    {isSaving ? "Saving changes…" : "Save changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSaving}
                    onClick={handleCancelEdits}
                    className="h-11 rounded-full px-5 text-xs font-semibold"
                  >
                    Discard changes
                  </Button>
                </div>
              </form>

              <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2 text-xs font-semibold transition-colors hover:text-[#e94717]"
              >
                Continue shopping <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </section>
          </div>
        ) : (
          <div className="max-w-lg py-16">
            <h2 className="font-serif text-2xl">Sign in to view your profile</h2>
            <p className="mt-3 text-sm leading-6 text-[#706c66]">
              Your account details will be here once you sign in.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-11 items-center gap-6 rounded-full bg-[#171512] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#e94717]"
            >
              Sign in <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}