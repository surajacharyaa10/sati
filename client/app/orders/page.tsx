import Link from "next/link"
import { ArrowRight, PackageCheck } from "lucide-react"
import { Footer } from "@/app/components/footer"
import { Navbar } from "@/app/components/navbar"

export default function OrdersPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[60vh] bg-white text-[#171512]">
        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-14">
          <div className="border-b border-black/10 pb-6 sm:pb-8">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#e94717]">Your SATI account</p>
            <h1 className="font-serif text-4xl leading-none sm:text-5xl">Order history</h1>
          </div>

          <div className="flex flex-col items-start py-16 sm:py-20">
            <PackageCheck aria-hidden="true" className="size-10 text-[#e94717]" />
            <h2 className="mt-5 font-serif text-2xl">No orders yet</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#706c66]">
              Once checkout is available, your order details and delivery updates will appear here.
            </p>
            <Link
              href="/arrival-new"
              className="mt-6 inline-flex h-11 items-center gap-5 rounded-full bg-[#171512] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#e94717] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e94717]"
            >
              Shop new arrivals <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}