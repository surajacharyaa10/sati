"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Phone, Mail, MapPin, Sparkles } from "lucide-react"
import { contactApi, type SiteContact } from "@/lib/api"

const marqueeItems = [
  "Color outside the lines",
  "Designed for real life",
  "Made with intention",
]

const DEFAULT_CONTACT: SiteContact = {
  address: "Thamel 327, Kathmandu, Nepal",
  phone: "+977 9801475272",
  gmail: "surajacharya239@gmail.com",
  availabilityStatus: "Available for bespoke consultation & orders",
  socialLinks: {
    instagram: "https://instagram.com/sati_atelier",
    facebook: "https://facebook.com/sati.atelier",
    tiktok: "https://tiktok.com/@sati_atelier",
    whatsapp: "+9779801475272",
    pinterest: "https://pinterest.com/sati_atelier",
    youtube: "",
  },
}

export function Footer() {
  const [contact, setContact] = useState<SiteContact>(DEFAULT_CONTACT)

  useEffect(() => {
    let cancelled = false
    async function loadSiteContact() {
      try {
        const data = await contactApi.get()
        if (!cancelled && data) {
          const resolved = Array.isArray(data) ? data[0] : data
          setContact((prev) => ({
            ...prev,
            ...resolved,
            socialLinks: {
              ...prev.socialLinks,
              ...(resolved.socialLinks || {}),
            },
          }))
        }
      } catch {
        // Keep default fallback gracefully
      }
    }

    loadSiteContact()
    return () => {
      cancelled = true
    }
  }, [])

  const socialList: { label: string; href: string }[] = []
  const links = contact.socialLinks || {}

  if (links.instagram) socialList.push({ label: "Instagram", href: links.instagram })
  if (links.facebook) socialList.push({ label: "Facebook", href: links.facebook })
  if (links.tiktok) socialList.push({ label: "TikTok", href: links.tiktok })
  if (links.whatsapp) {
    const waHref = links.whatsapp.startsWith("http")
      ? links.whatsapp
      : `https://wa.me/${links.whatsapp.replace(/[^0-9]/g, "")}`
    socialList.push({ label: "WhatsApp", href: waHref })
  }
  if (links.pinterest) socialList.push({ label: "Pinterest", href: links.pinterest })
  if (links.youtube) socialList.push({ label: "YouTube", href: links.youtube })

  // Fallback if none configured
  if (socialList.length === 0) {
    socialList.push(
      { label: "Instagram", href: "https://instagram.com/sati_atelier" },
      { label: "Pinterest", href: "https://pinterest.com/sati_atelier" }
    )
  }

  return (
    <footer className="bg-[#f7f3eb] text-[#171512]">
      {/* Values Marquee */}
      <div
        role="region"
        aria-label="SATI values"
        className="overflow-hidden bg-[#e94717] text-white"
      >
        <p className="sr-only">
          Color outside the lines. Designed for real life. Made with intention.
        </p>
        <div
          aria-hidden="true"
          className="sati-marquee-track flex w-max font-serif text-sm italic sm:text-base"
        >
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex min-h-12 shrink-0 items-center px-3 sm:px-5"
            >
              {marqueeItems.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-5 px-3 sm:gap-8 sm:px-5"
                >
                  {item}
                  <span className="text-white/80">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr] lg:gap-14">
          {/* Brand & Direct Contact Channels */}
          <div className="max-w-md space-y-4">
            <Link href="/" aria-label="SATI home" className="inline-flex">
              <Image
                src="/logo/logo.png"
                alt="SATI"
                width={96}
                height={96}
                className="size-24 object-contain mix-blend-multiply"
              />
            </Link>

            <p className="text-xs leading-5 text-[#706c66]">
              Thoughtful pieces. A little color. Handcrafted atelier garments made to move with you.
            </p>

            {/* Direct Contact from DB */}
            <div className="pt-2 space-y-2 border-t border-black/10 text-xs text-[#524e47]">
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-[#e94717] shrink-0" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="font-medium text-[#171512] transition-colors hover:text-[#e94717]"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}

              {contact.gmail && (
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-[#e94717] shrink-0" />
                  <a
                    href={`mailto:${contact.gmail}`}
                    className="font-medium text-[#171512] transition-colors hover:text-[#e94717]"
                  >
                    {contact.gmail}
                  </a>
                </div>
              )}

              {contact.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-[#e94717] shrink-0" />
                  <span>{contact.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links Grid */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-10">
            {/* Shop Navigation */}
            <nav aria-label="Shop">
              <h2 className="mb-4 text-[12px] font-bold uppercase tracking-[0.2em] text-[#171512]">
                Shop
              </h2>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/arrival-new"
                    className="text-[13px] text-[#706c66] transition-colors hover:text-[#e94717]"
                  >
                    New in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/women"
                    className="text-[13px] text-[#706c66] transition-colors hover:text-[#e94717]"
                  >
                    Women
                  </Link>
                </li>
                <li>
                  <Link
                    href="/men"
                    className="text-[13px] text-[#706c66] transition-colors hover:text-[#e94717]"
                  >
                    Men
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sale"
                    className="text-[13px] font-semibold text-[#e94717] transition-colors hover:underline"
                  >
                    Sale
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Help Navigation */}
            <nav aria-label="Help">
              <h2 className="mb-4 text-[12px] font-bold uppercase tracking-[0.2em] text-[#171512]">
                Help & Concierge
              </h2>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/account"
                    className="text-[13px] text-[#706c66] transition-colors hover:text-[#e94717]"
                  >
                    My account
                  </Link>
                </li>
                <li>
                  <Link
                    href="/orders"
                    className="text-[13px] text-[#706c66] transition-colors hover:text-[#e94717]"
                  >
                    Orders & Tracking
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e94717] hover:underline"
                  >
                    <span>Contact Us</span>
                    <span className="text-[10px]">↗</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/journal"
                    className="text-[13px] text-[#706c66] transition-colors hover:text-[#e94717]"
                  >
                    Journal
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Follow Navigation (from DB) */}
            <nav aria-label="Follow">
              <h2 className="mb-4 text-[12px] font-bold uppercase tracking-[0.2em] text-[#171512]">
                Follow
              </h2>
              <ul className="space-y-2.5">
                {socialList.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] text-[#706c66] transition-colors hover:text-[#e94717]"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-2 border-t border-black/10 pt-5 text-[12px] text-[#8b867e] sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SATI. All rights reserved.</p>
          <p>Thoughtful clothes. Made for everywhere.</p>
        </div>
      </div>
    </footer>
  )
}
