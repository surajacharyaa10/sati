"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { authApi } from "@/lib/api"
import { useAuth } from "@/app/components/auth-provider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    try {
      await authApi.signIn({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      })
      await refresh()
      router.replace("/")
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not sign in.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f3eb] text-[#171512]">
      <header className="flex h-20 items-center justify-between px-6 sm:px-12">
        <Link href="/" className="relative h-8 w-28">
          <Image src="/logo/logo.jpeg" alt="Sola" fill className="object-contain object-left" />
        </Link>
        <Link href="/signup" className="text-xs font-semibold uppercase tracking-wider hover:text-[#e94717]">
          Create account
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md rounded-2xl shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-3xl font-medium tracking-tight">Welcome back</CardTitle>
            <CardDescription>Please sign in to your account</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-1.5 h-11 w-full rounded-lg border border-black/15 bg-transparent px-3.5 text-sm outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="password">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-[#706c66] hover:text-[#e94717]">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="mt-1.5 h-11 w-full rounded-lg border border-black/15 bg-transparent px-3.5 text-sm outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-lg bg-[#171512] font-semibold text-white hover:bg-[#383838]">
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
              {errorMessage && <p role="alert" className="text-sm text-red-700">{errorMessage}</p>}
            </form>

            <p className="mt-8 text-center text-xs text-[#706c66]">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-[#171512] underline hover:text-[#e94717]">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}