import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function Hero() {
  return (
    <main className="bg-[#f5f1e9] text-[#171512]">
      <section className="mx-auto grid min-h-[calc(100svh-104px)] max-w-[1600px] grid-cols-1 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="relative flex min-h-[560px] flex-col justify-center overflow-hidden px-7 py-14 sm:px-12 lg:min-h-[620px] lg:px-[clamp(3rem,7vw,7rem)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 top-10 size-52 rounded-full border border-[#f04a1b]/20 after:absolute after:inset-4 after:rounded-full after:border after:border-[#f04a1b]/15"
          />

          <div className="relative z-10 max-w-xl">
            <p className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#e94717]">
              <span className="h-px w-5 bg-[#e94717]" />
          &apos;25 collection
            </p>

            <h1 className="font-serif text-[clamp(3.7rem,7.3vw,7rem)] font-medium leading-[0.82] tracking-[-0.075em]">
              Made to
              <br />
              <span className="italic text-[#e94717]">move</span> with
              <br />
              you.
            </h1>

            <p className="mt-7 max-w-sm text-sm leading-7 text-[#706c66] sm:text-base">
              Easy silhouettes. Vibrant energy. Considered pieces for every
              version of your day.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-5">
              <Link
                href="/women/new"
                className="inline-flex h-12 items-center gap-7 rounded-full bg-[#171512] px-6 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e94717]"
              >
                Shop new arrivals
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="/journal"
                className="border-b border-[#171512] pb-1 text-xs font-semibold transition-colors hover:border-[#e94717] hover:text-[#e94717]"
              >
                Our story
              </Link>
            </div>

            <div className="mt-10 flex max-w-sm items-center justify-between border-t border-black/10 pt-5">
              <div>
                <p className="font-serif text-3xl font-semibold leading-none">4.9</p>
                <p className="mt-2 text-[10px] text-[#706c66]">2k+ happy customers</p>
              </div>
              <div className="text-right">
                <div aria-label="Rated 5 out of 5 stars" className="text-lg tracking-[0.15em] text-[#e94717]">
                  <span aria-hidden="true">★★★★★</span>
                </div>
                <p className="text-[10px] text-[#706c66]">Loved, worn, and lived in</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative min-h-[520px] overflow-hidden bg-[#07152a] lg:min-h-[620px]">
          <Image
            src="/assets/image10.jpeg"
            alt="Model in a vivid red look against a deep blue backdrop"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 53vw"
            className="object-cover object-[center_38%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5" />
          <p className="absolute right-4 top-6 [writing-mode:vertical-rl] text-[8px] font-semibold uppercase tracking-[0.25em] text-white/90">
            Expression without limits
          </p>

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 text-white sm:p-9 lg:p-11">
            <div>
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.23em]">
                The color edit
              </p>
              <h2 className="max-w-xs font-serif text-2xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-3xl">
                Dopamine dressing,
                <br />
                perfected.
              </h2>
            </div>
            <Link
              href="/sale"
              aria-label="Explore the color edit"
              className="mb-0.5 inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-[#171512] transition-transform hover:translate-x-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
