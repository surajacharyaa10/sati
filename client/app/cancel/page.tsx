"use client"

import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

function RedirectContent() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/payment-failed?reason=Payment+was+cancelled")
  }, [router])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="size-8 animate-spin text-[#e94717]" />
      <p className="text-xs text-[#706c66]">Returning to checkout…</p>
    </div>
  )
}

export default function CancelRedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <RedirectContent />
    </Suspense>
  )
}
