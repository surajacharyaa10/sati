"use client"

import { useState, useEffect, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { authApi } from "@/lib/api"
import { Eye, EyeOff, Mail, ArrowRight, ArrowLeft, RotateCw, CheckCircle2, ShieldCheck, KeyRound, Sparkles } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()

  // 3 Distinct Screens: 'email' (Step 1) -> 'verify' (Step 2) -> 'password' (Step 3) -> 'redirecting'
  const [screen, setScreen] = useState<"email" | "verify" | "password" | "redirecting">("email")

  // Form State
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // UI State
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCountdown])

  // Screen 1: Request OTP for Gmail / Email
  async function handleSendEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage("Please enter a valid email address.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await authApi.forgotPassword(cleanEmail)
      setSuccessMessage(res.message || `A 6-digit recovery code has been sent to ${cleanEmail}`)
      setScreen("verify")
      setResendCountdown(60)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send reset code. Please check your email.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Screen 2: Verify OTP
  async function handleVerifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    const cleanOtp = otp.trim()
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMessage("Please enter the 6-digit verification code.")
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.verifyResetOtp({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
      })
      setSuccessMessage("Code verified! Please set your new password.")
      setScreen("password")
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Invalid or expired verification code.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Screen 3: Set New Password
  async function handleResetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters.")
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      })

      setScreen("redirecting")

      // Navigate to /login?reset=true so user signs in with new password first
      setTimeout(() => {
        router.replace("/login?reset=true")
        router.refresh()
      }, 1500)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to reset password. Please try again.")
      setIsSubmitting(false)
    }
  }

  // Resend OTP
  async function handleResendOtp() {
    if (resendCountdown > 0 || isResending) return
    setIsResending(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const res = await authApi.resendResetOtp(email.trim().toLowerCase())
      setSuccessMessage(res.message || "A new code has been sent to your email.")
      setResendCountdown(60)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not resend code.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#f7f3eb] text-[#171512]">
      {/* ── Left Editorial Showcase (Desktop Full Screen) ── */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between overflow-hidden bg-[#171512] text-white p-12 lg:p-16">
        {/* Background Editorial Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/image5.jpeg"
            alt="SATI Atelier Recovery"
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
            <Sparkles className="size-3 text-[#e94717]" /> Account Protection
          </span>
        </div>

        {/* Bottom Editorial Content */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase font-bold tracking-[0.25em] text-[#e94717]">
              Security & Verification
            </p>
            <h2 className="font-serif text-4xl xl:text-5xl font-medium leading-[1.15] text-white tracking-tight">
              Regain access to your bespoke atelier profile.
            </h2>
            <p className="text-sm text-white/75 font-light leading-relaxed">
              Our 3-step dynamic verification ensures your account, saved curation, and private transactions remain strictly confidential and protected.
            </p>
          </div>

          {/* Stepper Indicator on Left */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/15">
            <div className="flex items-center gap-2 text-xs">
              <span className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${
                screen === "email" ? "bg-[#e94717] text-white" : "bg-white/20 text-white"
              }`}>1</span>
              <span className={screen === "email" ? "text-white font-medium" : "text-white/60"}>Email</span>
            </div>
            <span className="text-white/30">―</span>
            <div className="flex items-center gap-2 text-xs">
              <span className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${
                screen === "verify" ? "bg-[#e94717] text-white" : "bg-white/20 text-white"
              }`}>2</span>
              <span className={screen === "verify" ? "text-white font-medium" : "text-white/60"}>Verification</span>
            </div>
            <span className="text-white/30">―</span>
            <div className="flex items-center gap-2 text-xs">
              <span className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${
                screen === "password" || screen === "redirecting" ? "bg-[#e94717] text-white" : "bg-white/20 text-white"
              }`}>3</span>
              <span className={screen === "password" || screen === "redirecting" ? "text-white font-medium" : "text-white/60"}>New Password</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Modern Interaction Pane (Full Screen) ── */}
      <div className="flex flex-1 flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-24 bg-white/80 lg:bg-white backdrop-blur-sm">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-[0.15em] text-[#171512]">SATI</span>
          </Link>
          <div className="ml-auto text-xs text-[#706c66]">
            Remember your credentials?{" "}
            <Link href="/login" className="font-semibold text-[#171512] underline underline-offset-4 hover:text-[#e94717] transition-colors">
              Sign in
            </Link>
          </div>
        </div>

        {/* Center Screen Container */}
        <div className="mx-auto w-full max-w-sm sm:max-w-md py-10">
          {/* Step Pill */}
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#706c66]">
            <KeyRound className="size-3 text-[#e94717]" />
            {screen === "email" && "Step 1 of 3 · Email Identification"}
            {screen === "verify" && "Step 2 of 3 · Code Verification"}
            {screen === "password" && "Step 3 of 3 · Set New Password"}
            {screen === "redirecting" && "Completed · Security Confirmed"}
          </div>

          {/* Heading */}
          <div className="space-y-2 mb-6">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#171512]">
              {screen === "email" && "Forgot password"}
              {screen === "verify" && "Enter verification code"}
              {screen === "password" && "Create new password"}
              {screen === "redirecting" && "Password updated!"}
            </h1>
            <p className="text-sm text-[#706c66]">
              {screen === "email" && "Enter your registered Gmail or email to receive your 6-digit recovery code."}
              {screen === "verify" && `We sent a 6-digit code to ${email}. Enter it below to verify your identity.`}
              {screen === "password" && "Choose a strong password with at least 8 characters to secure your account."}
              {screen === "redirecting" && "Your password has been changed. Directing you to sign in…"}
            </p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-700 animate-in fade-in slide-in-from-top-2">
              {errorMessage}
            </div>
          )}

          {successMessage && screen !== "redirecting" && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-800 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ════ SCREEN 1: GMAIL / EMAIL INPUT ════ */}
          {screen === "email" && (
            <form onSubmit={handleSendEmail} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="forgot-email">
                  Gmail / Email address
                </label>
                <div className="relative">
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-black/15 bg-transparent pl-4 pr-11 text-sm text-[#171512] outline-none transition focus:border-[#e94717] focus:ring-2 focus:ring-[#e94717]/15 placeholder:text-zinc-400"
                  />
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8b867e]" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-[#171512] text-sm font-semibold text-white hover:bg-[#e94717] active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 mt-2 shadow-sm"
              >
                {isSubmitting ? (
                  <span>Sending recovery code…</span>
                ) : (
                  <>
                    <span>Next: Send Verification Code</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#706c66] hover:text-[#171512] transition-colors"
                >
                  <ArrowLeft className="size-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}

          {/* ════ SCREEN 2: VERIFICATION OTP ════ */}
          {screen === "verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="forgot-otp">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setScreen("email")
                      setErrorMessage("")
                      setSuccessMessage("")
                    }}
                    className="text-xs font-semibold text-[#e94717] hover:underline"
                  >
                    Change email
                  </button>
                </div>
                <input
                  id="forgot-otp"
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  disabled={isSubmitting}
                  className="h-14 w-full rounded-xl border border-black/15 bg-transparent text-center font-mono text-3xl font-bold tracking-[0.35em] text-[#171512] outline-none transition focus:border-[#e94717] focus:ring-2 focus:ring-[#e94717]/15 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-zinc-400"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || otp.length < 6}
                className="h-12 w-full rounded-xl bg-[#171512] text-sm font-semibold text-white hover:bg-[#e94717] active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <span>Verifying code…</span>
                ) : (
                  <>
                    <span>Next: Set New Password</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              {/* Resend Cooldown */}
              <div className="flex items-center justify-between text-xs text-[#706c66] pt-1">
                <span>Didn&apos;t receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || isResending}
                  className="font-semibold text-[#e94717] hover:underline disabled:opacity-50 disabled:no-underline inline-flex items-center gap-1"
                >
                  {isResending ? (
                    <RotateCw className="size-3 animate-spin" />
                  ) : resendCountdown > 0 ? (
                    `Resend in ${resendCountdown}s`
                  ) : (
                    "Resend code"
                  )}
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setScreen("email")}
                  className="inline-flex items-center gap-1.5 text-xs text-[#706c66] hover:text-[#171512] transition-colors"
                >
                  <ArrowLeft className="size-3.5" /> Back to enter email
                </button>
              </div>
            </form>
          )}

          {/* ════ SCREEN 3: SET NEW PASSWORD ════ */}
          {screen === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="forgot-new-password">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="forgot-new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-black/15 bg-transparent pl-4 pr-11 text-sm text-[#171512] outline-none transition focus:border-[#e94717] focus:ring-2 focus:ring-[#e94717]/15 placeholder:text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#171512] transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="forgot-confirm-password">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="forgot-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-black/15 bg-transparent pl-4 pr-11 text-sm text-[#171512] outline-none transition focus:border-[#e94717] focus:ring-2 focus:ring-[#e94717]/15 placeholder:text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#171512] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-[#171512] text-sm font-semibold text-white hover:bg-[#e94717] active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 mt-4 shadow-sm"
              >
                {isSubmitting ? (
                  <span>Updating password…</span>
                ) : (
                  <>
                    <span>Reset Password & Go to Sign In</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* ════ REDIRECTING STATE ════ */}
          {screen === "redirecting" && (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="size-8 animate-in zoom-in-75 duration-300" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-medium text-[#171512]">Password Reset Complete!</h3>
                <p className="text-xs text-[#706c66]">Directing you to sign in with your new password…</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-black/5 pt-6 text-[11px] text-[#8b867e] gap-2">
          <span>&copy; 2026 SATI Atelier. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[#171512] transition-colors">Return to store</Link>
            <span>·</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-600" /> 256-bit SSL Recovery
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
