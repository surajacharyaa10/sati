import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/app/components/footer"
import { Navbar } from "@/app/components/navbar"
import { journalPosts } from "@/lib/journal-posts"

export default function JournalPage() {
  const [featuredPost, ...latestPosts] = journalPosts

  return (
    <>
      <Navbar />
      <main className="bg-white text-[#171512]">
        <section className="grid bg-[#f7f3eb] lg:min-h-[560px] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-[clamp(3rem,7vw,7rem)]">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.23em] text-[#e94717]">
              Sola journal / Issue 06
            </p>
            <h1 className="max-w-xl font-serif text-5xl leading-[0.92] sm:text-6xl">
              Stories in full color.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-6 text-[#706c66]">
              People, places and ideas moving fashion forward. Notes from our studio and the creative community around us.
            </p>
          </div>
          <div className="relative min-h-[300px] overflow-hidden bg-[#252421] sm:min-h-[400px] lg:min-h-[560px]">
            <Image
              src="/assets/image5.jpeg"
              alt="A maker working carefully at a sewing machine in the studio"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 55vw"
              className="object-cover object-center grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            <p className="absolute bottom-6 left-6 text-[11px] font-bold uppercase tracking-[0.2em] text-white sm:bottom-8 sm:left-8">
              Sola / Copenhagen
            </p>
          </div>
        </section>

        <section className="px-3 py-14 sm:px-4 sm:py-20 lg:px-6">
          <div className="mb-8 flex items-end justify-between border-b border-black/10 pb-4">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#e94717]">Latest notes</p>
              <h2 className="font-serif text-3xl sm:text-4xl">From the journal</h2>
            </div>
            <span className="hidden text-xs text-[#817c75] sm:block">Issue 06 · Spring / Summer</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
            {[featuredPost, ...latestPosts].map((post) => (
              <Link key={post.slug} href={`/journal/${post.slug}`} className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e94717]">
                <Card className="gap-0 rounded-none bg-transparent py-0 shadow-none ring-0">
                  <CardContent className="relative aspect-[4/3] overflow-hidden bg-[#f2eee8] p-0">
                    <Image
                      src={post.image}
                      alt={post.alt}
                      fill
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 48vw, 31vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </CardContent>
                  <CardHeader className="gap-2 px-0 pt-4">
                    <Badge className="w-fit rounded-none bg-transparent px-0 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e94717] hover:bg-transparent">
                      {post.category}
                    </Badge>
                    <CardTitle className="font-serif text-xl leading-tight transition-colors group-hover:text-[#e94717]">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-xs leading-5 text-[#706c66]">
                      {post.summary}
                    </CardDescription>
                    <span className="pt-1 text-[12px] text-[#817c75]">{post.readTime}</span>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-3 mb-14 bg-[#e94717] px-5 py-12 text-center text-white sm:mx-4 sm:mb-20 sm:py-16 lg:mx-6">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/75">Wear the change</p>
          <h2 className="font-serif text-3xl sm:text-5xl">Designed for now. Made to last.</h2>
          <Link
            href="/arrival-new"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-white px-6 text-[12px] font-semibold text-[#171512] transition-colors hover:bg-[#171512] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Shop new arrivals <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}