"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/app/components/navbar";
import { Footer } from "@/app/components/footer";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaUser,
  FaComment,
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaWhatsapp,
  FaPinterest,
  FaYoutube,
} from "react-icons/fa";
import { contactApi, type SiteContact, type ContactFormData } from "@/lib/api";

export default function ContactPage() {
  const form = useRef<HTMLFormElement | null>(null);
  const [contact, setContact] = useState<SiteContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ContactFormData>({
    from_name: "",
    from_email: "",
    from_phone: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const fetchContact = async () => {
      try {
        const data = await contactApi.get();
        if (!cancelled) {
          const resolved = Array.isArray(data) ? data[0] : data;
          setContact(resolved);
        }
      } catch (err) {
        console.error("Error fetching contact:", err);
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong loading contact information"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchContact();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");

    try {
      // Backend handles EmailJS call, DB storage, and email notifications
      await contactApi.send({
        from_name: formData.from_name,
        from_email: formData.from_email,
        from_phone: formData.from_phone,
        message: formData.message,
      });

      setIsSubmitting(false);
      setSubmitStatus("success");
      setFormData({
        from_name: "",
        from_email: "",
        from_phone: "",
        message: "",
      });

      setTimeout(() => {
        setSubmitStatus(null);
      }, 6000);
    } catch (err) {
      console.error("Failed to send message:", err);
      setIsSubmitting(false);
      setSubmitStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to send message. Please try again or reach out directly."
      );

      setTimeout(() => {
        setSubmitStatus(null);
      }, 6000);
    }
  };

  const socialLinks = contact?.socialLinks;

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#171512]">
      {/* Global Navbar */}
      <Navbar />

      <main className="flex-1 bg-white">
        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center px-4">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#e94717] border-t-transparent" />
              <p className="text-sm font-medium text-zinc-600">
                Loading contact details...
              </p>
            </div>
          </div>
        ) : error && !contact ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
            <p className="text-base font-semibold text-red-600">
              Error loading contact information
            </p>
            <p className="mt-1 text-sm text-zinc-600">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-[#e94717] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#d03d12]"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div id="contact" className="relative overflow-hidden bg-white py-12 sm:py-16 lg:py-20">
            {/* Subtle aesthetic accent glows */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute left-[-10%] top-10 h-72 w-72 rounded-full bg-[#06b6d4]/5 blur-3xl sm:left-10" />
              <div className="absolute bottom-10 right-[-10%] h-72 w-72 rounded-full bg-[#e94717]/5 blur-3xl sm:right-10" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Section Header */}
              <div className="mb-12 text-center sm:mb-16">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#e94717]">
                  <span>✦</span> SATI Concierge & Atelier
                </div>
                <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight text-[#171512] sm:text-5xl lg:text-6xl">
                  Get In Touch
                </h1>

                <p className="mx-auto max-w-[620px] px-4 text-base text-[#706c66] sm:text-lg">
                  Ready to discuss your bespoke order, styling consultation, or custom fitting? Send us a message and our team will get back to you promptly.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-8 sm:gap-12 lg:grid-cols-2">
                {/* Contact Form */}
                <div className="order-2 rounded-2xl border border-black/10 bg-white p-6 shadow-xl sm:rounded-3xl sm:p-8 lg:order-1">
                  <h2 className="mb-6 font-serif text-2xl font-bold text-[#e94717] sm:text-3xl">
                    Send Message
                  </h2>

                  {/* Status Alerts */}
                  {submitStatus === "success" && (
                    <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-50 p-4">
                      <p className="text-sm font-medium text-emerald-800">
                        ✅ Message sent successfully! Our atelier team will get back to you soon.
                      </p>
                    </div>
                  )}

                  {submitStatus === "error" && (
                    <div className="mb-6 rounded-xl border border-red-500/40 bg-red-50 p-4">
                      <p className="text-sm font-medium text-red-700">
                        ❌ {errorMessage || "Failed to send message. Please try again or contact us directly."}
                      </p>
                    </div>
                  )}

                  <form
                    ref={form}
                    onSubmit={sendEmail}
                    className="space-y-4 sm:space-y-6"
                  >
                    <div className="relative">
                      <FaUser className="absolute left-3.5 top-3.5 text-sm text-[#06b6d4] sm:left-4 sm:top-4 sm:text-base" />
                      <input
                        type="text"
                        name="from_name"
                        value={formData.from_name}
                        onChange={handleInputChange}
                        placeholder="Your Name"
                        required
                        className="w-full rounded-lg border border-black/15 bg-zinc-50/70 py-3 pl-10 pr-3 text-sm text-[#171512] placeholder-zinc-400 transition-all duration-300 focus:border-[#e94717] focus:bg-white focus:outline-none sm:rounded-xl sm:py-4 sm:pl-12 sm:pr-4 sm:text-base"
                      />
                    </div>

                    <div className="relative">
                      <FaEnvelope className="absolute left-3.5 top-3.5 text-sm text-[#06b6d4] sm:left-4 sm:top-4 sm:text-base" />
                      <input
                        type="email"
                        name="from_email"
                        value={formData.from_email}
                        onChange={handleInputChange}
                        placeholder="Your Email"
                        required
                        className="w-full rounded-lg border border-black/15 bg-zinc-50/70 py-3 pl-10 pr-3 text-sm text-[#171512] placeholder-zinc-400 transition-all duration-300 focus:border-[#e94717] focus:bg-white focus:outline-none sm:rounded-xl sm:py-4 sm:pl-12 sm:pr-4 sm:text-base"
                      />
                    </div>

                    <div className="relative">
                      <FaPhone className="absolute left-3.5 top-3.5 text-sm text-[#06b6d4] sm:left-4 sm:top-4 sm:text-base" />
                      <input
                        type="tel"
                        name="from_phone"
                        value={formData.from_phone}
                        onChange={handleInputChange}
                        placeholder="Your Phone Number"
                        className="w-full rounded-lg border border-black/15 bg-zinc-50/70 py-3 pl-10 pr-3 text-sm text-[#171512] placeholder-zinc-400 transition-all duration-300 focus:border-[#e94717] focus:bg-white focus:outline-none sm:rounded-xl sm:py-4 sm:pl-12 sm:pr-4 sm:text-base"
                      />
                    </div>

                    <div className="relative">
                      <FaComment className="absolute left-3.5 top-3.5 text-sm text-[#06b6d4] sm:left-4 sm:top-4 sm:text-base" />
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Your Message, sizing questions, or bespoke ideas..."
                        required
                        rows={5}
                        className="min-h-[120px] w-full resize-none rounded-lg border border-black/15 bg-zinc-50/70 py-3 pl-10 pr-3 text-sm text-[#171512] placeholder-zinc-400 transition-all duration-300 focus:border-[#e94717] focus:bg-white focus:outline-none sm:min-h-[140px] sm:rounded-xl sm:py-4 sm:pl-12 sm:pr-4 sm:text-base"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#06b6d4] to-[#e94717] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-xl sm:py-4 sm:text-base"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Sending message...</span>
                        </>
                      ) : (
                        <>
                          <FaPaperPlane />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Contact Information & Channels */}
                <div className="order-1 space-y-6 sm:space-y-8 lg:order-2">
                  <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xl sm:rounded-3xl sm:p-8">
                    <h2 className="mb-6 font-serif text-2xl font-bold text-[#e94717] sm:text-3xl">
                      Contact Info
                    </h2>

                    <div className="space-y-4 sm:space-y-6">
                      {contact?.address && (
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#06b6d4]/20 bg-[#06b6d4]/10 sm:h-12 sm:w-12">
                            <FaMapMarkerAlt className="text-base text-[#06b6d4]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-[#171512] sm:text-base">
                              Atelier Address
                            </h3>
                            <p className="break-words text-sm text-[#706c66] sm:text-base">
                              {contact.address}
                            </p>
                          </div>
                        </div>
                      )}

                      {contact?.phone && (
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e94717]/20 bg-[#e94717]/10 sm:h-12 sm:w-12">
                            <FaPhone className="text-base text-[#e94717]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-[#171512] sm:text-base">
                              Direct Phone
                            </h3>
                            <a
                              href={`tel:${contact.phone}`}
                              className="break-words text-sm font-medium text-[#706c66] transition hover:text-[#e94717] sm:text-base"
                            >
                              {contact.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {contact?.gmail && (
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#06b6d4]/20 bg-[#06b6d4]/10 sm:h-12 sm:w-12">
                            <FaEnvelope className="text-base text-[#06b6d4]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-[#171512] sm:text-base">
                              Official Gmail
                            </h3>
                            <a
                              href={`mailto:${contact.gmail}`}
                              className="break-words text-sm font-medium text-[#706c66] transition hover:text-[#06b6d4] sm:text-base"
                            >
                              {contact.gmail}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Social Media Channels */}
                    {socialLinks && (
                      <div className="mt-8 border-t border-black/10 pt-6">
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Connect On Social Media
                        </h4>
                        <div className="flex flex-wrap gap-2.5">
                          {socialLinks.instagram && (
                            <a
                              href={socialLinks.instagram}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-xl border border-black/10 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:border-[#06b6d4] hover:text-[#06b6d4]"
                            >
                              <FaInstagram className="text-sm text-pink-600" />
                              Instagram
                            </a>
                          )}
                          {socialLinks.facebook && (
                            <a
                              href={socialLinks.facebook}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-xl border border-black/10 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:border-[#06b6d4] hover:text-[#06b6d4]"
                            >
                              <FaFacebook className="text-sm text-blue-600" />
                              Facebook
                            </a>
                          )}
                          {socialLinks.tiktok && (
                            <a
                              href={socialLinks.tiktok}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-xl border border-black/10 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:border-[#06b6d4] hover:text-[#06b6d4]"
                            >
                              <FaTiktok className="text-sm text-black" />
                              TikTok
                            </a>
                          )}
                          {socialLinks.whatsapp && (
                            <a
                              href={
                                socialLinks.whatsapp.startsWith("http")
                                  ? socialLinks.whatsapp
                                  : `https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g, "")}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-xl border border-black/10 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:border-[#06b6d4] hover:text-[#06b6d4]"
                            >
                              <FaWhatsapp className="text-sm text-emerald-600" />
                              WhatsApp
                            </a>
                          )}
                          {socialLinks.pinterest && (
                            <a
                              href={socialLinks.pinterest}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-xl border border-black/10 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:border-[#06b6d4] hover:text-[#06b6d4]"
                            >
                              <FaPinterest className="text-sm text-red-600" />
                              Pinterest
                            </a>
                          )}
                          {socialLinks.youtube && (
                            <a
                              href={socialLinks.youtube}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-xl border border-black/10 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:border-[#06b6d4] hover:text-[#06b6d4]"
                            >
                              <FaYoutube className="text-sm text-red-600" />
                              YouTube
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
