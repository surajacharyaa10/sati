"use client"

import { Suspense, useState, useEffect, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { authApi } from "@/lib/api"
import { useAuth } from "@/app/components/auth-provider"
import { Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f3eb]" />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/"
  const isRegistered = searchParams.get("registered") === "true"
  const isReset = searchParams.get("reset") === "true"

  const { refresh } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [infoMessage, setInfoMessage] = useState("")

  useEffect(() => {
    if (isRegistered) {
      setInfoMessage("Account created successfully! Please sign in with your email and password.")
    } else if (isReset) {
      setInfoMessage("Password reset successfully! Please sign in with your new password.")
    }
  }, [isRegistered, isReset])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)

    try {
      await authApi.signIn({
        email: email.trim().toLowerCase(),
        password,
      })
      await refresh().catch(() => {})
      router.replace(redirect)
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Invalid email or password.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#f7f3eb] text-[#171512]">
      {/* ── Left Editorial Showcase (Desktop Full Screen) ── */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between overflow-hidden bg-[#171512] text-white p-12 lg:p-16">
        {/* Background Editorial Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/image3.jpeg"
            alt="SATI Atelier Collection"
            fill
            className="object-cover object-center opacity-65 scale-105 transition-transform duration-1000 ease-out"
            priority
          />
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />
        </div>

        {/* Top Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-serif text-3xl font-bold tracking-[0.2em] text-white group-hover:text-[#e94717] transition-colors">
              SATI
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-widest text-white/60 pl-2 border-l border-white/20">
              Atelier
            </span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-medium text-white/90 border border-white/10">
            <Sparkles className="size-3 text-[#e94717]" /> Autumn / Winter Collection
          </span>
        </div>

        {/* Bottom Editorial Content */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase font-bold tracking-[0.25em] text-[#e94717]">
              Haute Couture & Everyday Essentials
            </p>
            <h2 className="font-serif text-4xl xl:text-5xl font-medium leading-[1.15] text-white tracking-tight">
              Elevated silhouettes, handcrafted for the modern silhouette.
            </h2>
            <p className="text-sm text-white/75 font-light leading-relaxed">
              Sign in to manage your curated wardrobe, track real-time bespoke deliveries across Nepal and the UK, and access private atelier releases.
            </p>
          </div>

          {/* Social Proof Badge */}
          <div className="flex items-center gap-4 pt-2 border-t border-white/15">
            <div className="flex -space-x-2">
              <div className="size-8 rounded-full border-2 border-black bg-zinc-700 flex items-center justify-center text-[10px] font-bold">SA</div>
              <div className="size-8 rounded-full border-2 border-black bg-[#e94717] flex items-center justify-center text-[10px] font-bold text-white">★</div>
              <div className="size-8 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-bold">UK</div>
            </div>
            <div className="text-xs text-white/80">
              <span className="font-semibold text-white">4.9 / 5 Rating</span> · Over 12,000+ luxury pieces delivered
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Modern Interaction Pane (Full Screen) ── */}
      <div className="flex flex-1 flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-24 bg-white/80 lg:bg-white backdrop-blur-sm">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-[0.15em] text-[#171512]">SATI</span>
          </Link>
          <div className="ml-auto text-xs text-[#706c66]">
            New to SATI?{" "}
            <Link href="/signup" className="font-semibold text-[#171512] underline underline-offset-4 hover:text-[#e94717] transition-colors">
              Create an account
            </Link>
          </div>
        </div>

        {/* Center Card / Form */}
        <div className="mx-auto w-full max-w-sm sm:max-w-md py-12">
          {/* Header */}
          <div className="space-y-2 mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#171512]">
              Welcome back
            </h1>
            <p className="text-sm text-[#706c66]">
              Sign in with your email address to access your bespoke account.
            </p>
          </div>

          {/* Banners */}
          {infoMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-800 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-700 animate-in fade-in slide-in-from-top-2">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="login-email">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-black/15 bg-transparent px-4 text-sm text-[#171512] outline-none transition focus:border-[#e94717] focus:ring-2 focus:ring-[#e94717]/15 placeholder:text-zinc-400"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="login-password">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#706c66] hover:text-[#e94717] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl border border-black/15 bg-transparent pl-4 pr-11 text-sm text-[#171512] outline-none transition focus:border-[#e94717] focus:ring-2 focus:ring-[#e94717]/15 placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#171512] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl bg-[#171512] text-sm font-semibold text-white hover:bg-[#e94717] active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              {isSubmitting ? (
                <span>Signing in…</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Alternative Switch */}
          <div className="mt-8 text-center text-xs text-[#706c66]">
            Don&apos;t have an account yet?{" "}
            <Link href="/signup" className="font-semibold text-[#171512] underline underline-offset-4 hover:text-[#e94717] transition-colors">
              Create an account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-black/5 pt-6 text-[11px] text-[#8b867e] gap-2">
          <span>&copy; 2026 SATI Atelier. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[#171512] transition-colors">Return to store</Link>
            <span>·</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-600" /> 256-bit SSL Secure
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}