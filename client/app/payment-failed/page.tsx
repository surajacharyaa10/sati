"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"

function PaymentFailedContent() {
  const params = useSearchParams()
  const reason = params.get("reason")

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-white text-[#171512]">
      <section className="flex flex-col items-center gap-5 px-5 py-20 text-center max-w-md">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <XCircle className="size-10 text-red-500" />
        </div>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-red-500">Payment failed</p>
          <h1 className="font-serif text-4xl leading-none">Something went wrong</h1>
        </div>
        <p className="text-sm leading-6 text-[#706c66]">
          Your payment could not be completed. No money has been charged.
          {reason && (
            <span className="mt-2 block rounded bg-red-50 px-3 py-2 text-[11px] font-mono text-red-600">
              {decodeURIComponent(reason)}
            </span>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
          <Link
            href="/checkout"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#171512] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#e94717]"
          >
            <RefreshCw className="size-3.5" />
            Try again
          </Link>
          <Link
            href="/cart"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-black/15 px-5 text-xs font-semibold text-[#171512] transition-colors hover:border-[#e94717] hover:text-[#e94717]"
          >
            <ArrowLeft className="size-3.5" />
            Back to bag
          </Link>
        </div>
      </section>
    </main>
  )
}

export default function PaymentFailedPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-[60vh] bg-white" />}>
        <PaymentFailedContent />
      </Suspense>
      <Footer />
    </>
  )
}
