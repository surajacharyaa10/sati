import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Footer } from "@/app/components/footer"
import { Navbar } from "@/app/components/navbar"
import { journalPosts } from "@/lib/journal-posts"

export function generateStaticParams() {
  return journalPosts.map(({ slug }) => ({ slug }))
}

export default async function JournalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = journalPosts.find((post) => post.slug === slug)

  if (!article) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <main className="bg-white text-[#171512]">
        <article>
          <header className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
            <Link href="/journal" className="mb-10 inline-flex items-center gap-2 text-xs font-semibold text-[#706c66] transition-colors hover:text-[#e94717]">
              <ArrowLeft aria-hidden="true" className="size-4" /> Back to journal
            </Link>
            <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.23em] text-[#e94717]">
              {article.category} · Sola Journal
            </p>
            <h1 className="max-w-3xl font-serif text-4xl leading-[0.98] sm:text-6xl">
              {article.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-[#706c66] sm:text-base">
              {article.summary}
            </p>
            <p className="mt-5 text-[10px] text-[#817c75]">{article.readTime} · Issue 06</p>
          </header>

          <div className="relative mx-auto aspect-[16/9] max-h-[640px] max-w-7xl overflow-hidden bg-[#f2eee8]">
            <Image
              src={article.image}
              alt={article.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>

          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[180px_minmax(0,720px)] lg:gap-20 lg:px-14">
            <aside className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#e94717]">
              Studio notes<br />Copenhagen
            </aside>
            <div className="space-y-6 text-sm leading-7 text-[#504d48] sm:text-base sm:leading-8">
              {article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <Link href="/journal" className="inline-flex items-center gap-2 pt-3 text-xs font-semibold text-[#171512] transition-colors hover:text-[#e94717]">
                More stories <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}