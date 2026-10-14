"use client"

import { useState, useEffect, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { authApi } from "@/lib/api"
import { useCurrency } from "@/lib/currency-context"
import { Eye, EyeOff, ArrowRight, ArrowLeft, RotateCw, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react"

type CountryOption = "Nepal" | "UK"

export default function SignupPage() {
  const router = useRouter()
  const { setCurrency } = useCurrency()

  // Steps: 'form' -> 'otp' -> 'redirecting'
  const [step, setStep] = useState<"form" | "otp" | "redirecting">("form")

  // Form State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [country, setCountry] = useState<CountryOption>("Nepal")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOtp] = useState("")

  // UI State
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCountdown])

  // Handle Country Change
  function handleCountryChange(newCountry: CountryOption) {
    setCountry(newCountry)
    setCurrency(newCountry === "UK" ? "GBP" : "NPR")
  }

  // Step 1: Submit Form to Send OTP
  async function handleSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.")
      return
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.")
      return
    }

    if (!phoneNumber.trim() || phoneNumber.trim().length < 6) {
      setErrorMessage("Please enter a valid contact phone number.")
      return
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    setIsSubmitting(true)
    try {
      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber.trim()
        : `${country === "UK" ? "+44" : "+977"}${phoneNumber.replace(/^0+/, "").trim()}`

      const res = await authApi.sendSignupOtp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        country,
        phoneNumber: formattedPhone,
        password,
      })

      setSuccessMessage(res.message || `A 6-digit verification code has been sent to ${email}`)
      setStep("otp")
      setResendCountdown(60)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to initiate registration.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 2: Verify OTP
  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    const cleanOtp = otp.trim()
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMessage("Please enter the 6-digit code sent to your email.")
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.verifySignupOtp({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
      })

      setStep("redirecting")

      // Navigate to /login?registered=true so user signs in first as requested
      setTimeout(() => {
        router.replace("/login?registered=true")
        router.refresh()
      }, 1500)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Verification code is invalid or has expired.")
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
      const res = await authApi.resendSignupOtp(email.trim().toLowerCase())
      setSuccessMessage(res.message || "A new code has been sent to your email.")
      setResendCountdown(60)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not resend code.")
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
            src="/assets/image1.jpeg"
            alt="SATI Atelier Bespoke Design"
            fill
            className="object-cover object-center opacity-65 scale-105 transition-transform duration-1000 ease-out"
            priority
          />
          {/* Vignette */}
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
            <Sparkles className="size-3 text-[#e94717]" /> Bespoke Membership
          </span>
        </div>

        {/* Bottom Editorial Content */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase font-bold tracking-[0.25em] text-[#e94717]">
              Join the SATI Community
            </p>
            <h2 className="font-serif text-4xl xl:text-5xl font-medium leading-[1.15] text-white tracking-tight">
              Crafted in Kathmandu, styled globally.
            </h2>
            <p className="text-sm text-white/75 font-light leading-relaxed">
              Create your account to unlock private seasonal sales, currency-matched checkout in NPR (Rs) or GBP (£), and dedicated concierge support.
            </p>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-4 pt-2 border-t border-white/15">
            <div className="flex -space-x-2">
              <div className="size-8 rounded-full border-2 border-black bg-zinc-700 flex items-center justify-center text-[10px] font-bold">NP</div>
              <div className="size-8 rounded-full border-2 border-black bg-[#e94717] flex items-center justify-center text-[10px] font-bold text-white">★</div>
              <div className="size-8 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-bold">UK</div>
            </div>
            <div className="text-xs text-white/80">
              <span className="font-semibold text-white">100% Authentic Fabrications</span> · Premium customer satisfaction
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Modern Interaction Pane (Full Screen) ── */}
      <div className="flex flex-1 flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-24 bg-white/80 lg:bg-white backdrop-blur-sm overflow-y-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-[0.15em] text-[#171512]">SATI</span>
          </Link>
          <div className="ml-auto text-xs text-[#706c66]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#171512] underline underline-offset-4 hover:text-[#e94717] transition-colors">
              Sign in
            </Link>
          </div>
        </div>

        {/* Center Container */}
        <div className="mx-auto w-full max-w-sm sm:max-w-md py-8">
          {/* Header */}
          <div className="space-y-2 mb-6">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#171512]">
              {step === "form" && "Create an account"}
              {step === "otp" && "Verify your email"}
              {step === "redirecting" && "Account verified!"}
            </h1>
            <p className="text-sm text-[#706c66]">
              {step === "form" && "Enter your details to create your bespoke profile."}
              {step === "otp" && `We sent a 6-digit verification code to ${email}.`}
              {step === "redirecting" && "Registration complete! Directing you to sign in…"}
            </p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-700 animate-in fade-in slide-in-from-top-2">
              {errorMessage}
            </div>
          )}

          {successMessage && step !== "redirecting" && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-800 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* STEP 1: Registration Form */}
          {step === "form" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="signup-name">
                  Full name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  autoFocus
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aarav Sharma"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-xl border border-black/15 bg-transparent px-4 text-sm text-[#171512] outline-none transition focus:border-[#e94717] focus:ring-2 focus:ring-[#e94717]/15 placeholder:text-zinc-400"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="signup-email">
                  Email address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-xl border border-black/15 bg-transparent px-4 text-sm text-[#171512] outline-none transition focus:border-[#e94717] focus:ring-2 focus:ring-[#e94717]/15 placeholder:text-zinc-400"
                />
              </div>

              {/* Country Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]">
                  Country & Currency Preference
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleCountryChange("Nepal")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                      country === "Nepal"
                        ? "border-[#171512] bg-[#171512] text-white shadow-xs"
                        : "border-black/15 bg-transparent text-[#706c66] hover:border-black/30 hover:text-[#171512]"
                    }`}
                  >
                    <span>Nepal</span>
                    <span className="text-[10px] opacity-75">· Rs (NPR)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCountryChange("UK")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                      country === "UK"
                        ? "border-[#171512] bg-[#171512] text-white shadow-xs"
                        : "border-black/15 bg-transparent text-[#706c66] hover:border-black/30 hover:text-[#171512]"
                    }`}
                  >
                    <span>United Kingdom</span>
                    <span className="text-[10px] opacity-75">· £ (GBP)</span>
                  </button>
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="signup-phone">
                  Phone number
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center rounded-l-xl border border-r-0 border-black/15 bg-black/5 px-3 text-xs font-mono text-[#706c66]">
                    {country === "UK" ? "+44" : "+977"}
                  </span>
                  <input
                    id="signup-phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={country === "UK" ? "7911 123456" : "98XXXXXXXX"}
                    disabled={isSubmitting}
                    className="h-11 flex-1 rounded-r-xl border border-black/15 bg-transparent px-4 text-sm text-[#171512] outline-none transition focus:border-[#e94717] focus:ring-2 focus:ring-[#e94717]/15 placeholder:text-zinc-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="signup-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-xl border border-black/15 bg-transparent pl-4 pr-11 text-sm text-[#171512] outline-none transition focus:border-[#e94717] focus:ring-2 focus:ring-[#e94717]/15 placeholder:text-zinc-400"
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="signup-confirm-password">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-xl border border-black/15 bg-transparent pl-4 pr-11 text-sm text-[#171512] outline-none transition focus:border-[#e94717] focus:ring-2 focus:ring-[#e94717]/15 placeholder:text-zinc-400"
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-[#171512] text-sm font-semibold text-white hover:bg-[#e94717] active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 mt-4 shadow-sm"
              >
                {isSubmitting ? (
                  <span>Sending code…</span>
                ) : (
                  <>
                    <span>Continue to Verification</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="otp-input">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("form")
                      setErrorMessage("")
                      setSuccessMessage("")
                    }}
                    className="text-xs font-semibold text-[#e94717] hover:underline"
                  >
                    Edit details
                  </button>
                </div>
                <input
                  id="otp-input"
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
                {isSubmitting ? "Verifying code…" : "Complete Registration"}
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
                  onClick={() => setStep("form")}
                  className="inline-flex items-center gap-1.5 text-xs text-[#706c66] hover:text-[#171512] transition-colors"
                >
                  <ArrowLeft className="size-3.5" /> Back to edit registration
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Redirecting to Sign In */}
          {step === "redirecting" && (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="size-8 animate-in zoom-in-75 duration-300" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-medium text-[#171512]">Registration Complete!</h3>
                <p className="text-xs text-[#706c66]">Redirecting you to the sign-in page to access your account…</p>
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
              <ShieldCheck className="size-3 text-emerald-600" /> Secure Registration
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}