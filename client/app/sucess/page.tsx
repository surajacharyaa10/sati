"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

function RedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = searchParams.toString()
    router.replace(`/payment-success${params ? `?${params}` : ""}`)
  }, [router, searchParams])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="size-8 animate-spin text-[#e94717]" />
      <p className="text-xs text-[#706c66]">Confirming your payment…</p>
    </div>
  )
}

export default function SuccessRedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <RedirectContent />
    </Suspense>
  )
}
