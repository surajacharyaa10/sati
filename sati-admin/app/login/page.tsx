"use client"

import { Suspense, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { adminAuth } from "@/lib/admin-api"
import { ShieldCheck, Eye, EyeOff } from "lucide-react"

function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen flex-col bg-black text-white" />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/"
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    try {
      await adminAuth.signIn({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      })
      router.replace(redirect)
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not sign in.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex h-16 items-center justify-between border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e94717] text-white font-serif text-lg font-bold">
            S
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight">SATI Admin</span>
        </div>
        <span className="text-xs text-zinc-400 uppercase tracking-widest">Authentication Required</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md rounded-2xl border-white/10 bg-zinc-950/60 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e94717] text-white">
              <ShieldCheck className="size-6" />
            </div>
            <CardTitle className="font-serif text-2xl font-medium tracking-tight">Admin Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the management console</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  required
                  autoComplete="username"
                  className="h-11 w-full rounded-lg border border-white/15 bg-zinc-900/50 px-3.5 text-sm outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717] placeholder:text-zinc-500"
                  placeholder="admin or you@example.com"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="h-11 w-full rounded-lg border border-white/15 bg-zinc-900/50 px-3.5 text-sm outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717] placeholder:text-zinc-500 pr-10"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-zinc-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-lg bg-[#e94717] font-semibold text-white hover:bg-[#d03e12] disabled:opacity-50">
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
              {errorMessage && (
                <p role="alert" className="text-sm text-center text-red-400 bg-red-950/40 border border-red-500/40 rounded-lg p-3">
                  {errorMessage}
                </p>
              )}
            </form>

         
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default AdminLoginPage