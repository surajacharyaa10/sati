"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { usersApi } from "@/lib/api"
import { Eye, EyeOff } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")
    setIsSubmitting(true)

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      await usersApi.create({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      })
      form.reset()
      setSuccessMessage("Your account was created. You can now sign in.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not create your account.")
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
        <Link href="/login" className="text-xs font-semibold uppercase tracking-wider hover:text-[#e94717]">
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md rounded-2xl shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-3xl font-medium tracking-tight">Create an account</CardTitle>
            <CardDescription>Join Sola for exclusive access and rewards</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className="mt-1.5 h-11 w-full rounded-lg border border-black/15 bg-transparent px-3.5 text-sm outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                  placeholder="Jane Doe"
                />
              </div>

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
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#706c66]" htmlFor="password">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    className="h-11 w-full rounded-lg border border-black/15 bg-transparent pl-3.5 pr-10 text-sm outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#171512] transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-lg bg-[#171512] font-semibold text-white hover:bg-[#383838]">
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>

              {errorMessage && <p role="alert" className="text-sm text-red-700">{errorMessage}</p>}
              {successMessage && <p role="status" className="text-sm text-green-700">{successMessage}</p>}
            </form>

            <p className="mt-8 text-center text-xs text-[#706c66]">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-[#171512] underline hover:text-[#e94717]">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}