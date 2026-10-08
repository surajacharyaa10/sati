import Image from "next/image"
import Link from "next/link"

const footerGroups = [
  {
    title: "Shop",
    links: [
      { label: "New in", href: "/arrival-new" },
      { label: "Women", href: "/women" },
      { label: "Men", href: "/men" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "My account", href: "/account" },
      { label: "Orders", href: "/orders" },
      { label: "Contact", href: "mailto:hello@sati.com" },
    ],
  },
  {
    title: "Follow",
    links: [
      { label: "Instagram", href: "https://www.instagram.com/" },
      { label: "Pinterest", href: "https://www.pinterest.com/" },
      { label: "TikTok", href: "https://www.tiktok.com/" },
    ],
  },
]

const marqueeItems = ["Color outside the lines", "Designed for real life", "Made with intention"]

export function Footer() {
  return (
    <footer className="bg-[#f7f3eb] text-[#171512]">
      <div role="region" aria-label="SATI values" className="overflow-hidden bg-[#e94717] text-white">
        <p className="sr-only">Color outside the lines. Designed for real life. Made with intention.</p>
        <div aria-hidden="true" className="sati-marquee-track flex w-max font-serif text-sm italic sm:text-base">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex min-h-12 shrink-0 items-center px-3 sm:px-5">
              {marqueeItems.map((item) => (
                <span key={item} className="inline-flex items-center gap-5 px-3 sm:gap-8 sm:px-5">
                  {item}
                  <span className="text-white/80">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-14">
        <div className="grid gap-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-12">
          <div className="max-w-sm">
            <Link href="/" aria-label="SATI home" className="inline-flex">
              <Image
                src="/logo/logo.jpeg"
                alt="SATI"
                width={96}
                height={96}
                className="size-24 object-contain mix-blend-multiply"
              />
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-5 text-[#706c66]">
              Thoughtful pieces. A little color. Made to move with you.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-7 sm:gap-10">
            {footerGroups.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className="mb-4 text-[9px] font-bold uppercase tracking-[0.2em]">
                  {group.title}
                </h2>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={link.href.startsWith("https://") ? "_blank" : undefined}
                        rel={link.href.startsWith("https://") ? "noreferrer" : undefined}
                        className="text-xs text-[#706c66] transition-colors hover:text-[#e94717]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-2 border-t border-black/10 pt-5 text-[9px] text-[#8b867e] sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SATI. All rights reserved.</p>
          <p>Thoughtful clothes. Made for everywhere.</p>
        </div>
      </div>
    </footer>
  )
}
