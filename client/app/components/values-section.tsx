import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const values = [
  { value: "Small runs", label: "Made with care" },
  { value: "Fair partners", label: "People first" },
  { value: "Less waste", label: "Thoughtful by design" },
]

export function ValuesSection() {
  return (
    <section aria-labelledby="values-title" className="grid bg-[#090909] text-white lg:grid-cols-2">
      <div className="relative min-h-[360px] overflow-hidden bg-[#ddd8cb] sm:min-h-[480px] lg:min-h-[600px]">
        <Image
          src="/assets/image9.jpeg"
          alt="Model in a relaxed, colorful look"
          fill
          sizes="(max-width: 1023px) 100vw, 50vw"
          className="object-cover object-[center_42%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <Link
          href="/arrival-new"
          className="absolute bottom-5 left-5 inline-flex h-9 items-center rounded-full bg-[#e94717] px-5 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white hover:text-[#171512] sm:bottom-7 sm:left-7"
        >
          Wear it your way
        </Link>
      </div>

      <div className="flex min-h-[420px] flex-col justify-center px-6 py-12 sm:px-12 sm:py-16 lg:min-h-[600px] lg:px-[clamp(3rem,7vw,7rem)]">
        <p className="mb-5 text-[9px] font-bold uppercase tracking-[0.23em] text-[#e94717]">
          Better basics, brighter outlook
        </p>
        <h2 id="values-title" className="max-w-xl font-serif text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">
          Clothes with
          <br />
          <span className="italic text-[#e94717]">good energy.</span>
        </h2>
        <p className="mt-6 max-w-lg text-sm leading-6 text-white/60">
          We design lasting pieces in small, considered runs. Better fabrics,
          fairer partnerships, and color that refuses to blend in.
        </p>

        <dl className="mt-8 grid grid-cols-3 border-y border-white/10 py-5 sm:mt-10 sm:py-6">
          {values.map((item) => (
            <div key={item.value} className="min-w-0 pr-2 sm:pr-4">
              <dt className="font-serif text-sm text-[#e94717] sm:text-lg">{item.value}</dt>
              <dd className="mt-1 text-[8px] uppercase tracking-[0.08em] text-white/40 sm:text-[9px]">
                {item.label}
              </dd>
            </div>
          ))}
        </dl>

        <Button
          type="button"
          variant="link"
          className="mt-6 h-auto w-fit justify-start gap-2 rounded-none px-0 text-[10px] font-semibold text-[#e94717] hover:text-white"
        >
          Discover our values <ArrowRight aria-hidden="true" className="size-3.5" />
        </Button>
      </div>
    </section>
  )
}