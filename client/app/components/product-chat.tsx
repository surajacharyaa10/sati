"use client"

import * as React from "react"
import Image from "next/image"
import {
  Sparkles,
  Send,
  User,
  ShoppingBag,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Circle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message"
import { Bubble } from "@/components/ui/bubble"
import { useAuth } from "@/app/components/auth-provider"
import { useCart } from "@/app/components/cart-provider"
import { formatRupees } from "@/lib/currency"
import { getDiscountPercentage } from "@/lib/pricing"
import { apiRequest } from "@/lib/api"
import type { StoreProduct } from "@/lib/store-products"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  sender: "user" | "assistant"
  text: string
  timestamp: string
  suggestedActions?: {
    type: "add_to_cart" | "quick_ask"
    label: string
    payload?: string
  }[]
}

// Shape of a server ChatSession message
interface LiveMsg {
  _id: string
  sender: "customer" | "admin"
  text: string
  readByCustomer?: boolean
  createdAt?: string
}

interface LiveSession {
  _id: string
  productId: string
  customerName: string
  customerEmail: string
  status: "active" | "closed"
  messages: LiveMsg[]
  lastActivity?: string
}

interface ProductChatProps {
  product: StoreProduct
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSelectColor?: (color: string) => void
  onSelectSize?: (size: string) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_QUESTIONS = [
  "How does the fit run?",
  "What fabric & care is needed?",
  "How should I style this piece?",
  "What colors & sizes are available?",
  "What is the return & shipping policy?",
]

const SESSION_KEY = (productId: string) => `sati_chat_session_${productId}`

function formatTime(iso?: string) {
  if (!iso) return "Just now"
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

// ─── Local fallback AI (used when backend AI is unavailable) ──────────────────

function generateAiFallback(
  query: string,
  product: StoreProduct
): { text: string; actions?: ChatMessage["suggestedActions"] } {
  const q = query.toLowerCase()
  const discount = product.originalPrice
    ? getDiscountPercentage(product.originalPrice, product.price)
    : 0

  if (q.includes("fit") || q.includes("size") || q.includes("sizing") || q.includes("measure")) {
    return {
      text: `The ${product.name} is designed with a **${product.fit}**.\n\nAvailable sizes: **${product.sizes.join(", ")}**. Fits true to Sati's contemporary tailoring. Size up for a relaxed drape.`,
      actions: [
        { type: "quick_ask", label: "What fabric is it made of?" },
        { type: "add_to_cart", label: "Add to Bag" },
      ],
    }
  }
  if (q.includes("fabric") || q.includes("material") || q.includes("care") || q.includes("wash")) {
    return {
      text: `The ${product.name} is crafted from **${product.material}**.\n\n**Care:** Wash inside-out in cold water with mild detergent. Dry flat away from sunlight.`,
      actions: [
        { type: "quick_ask", label: "How should I style this piece?" },
        { type: "quick_ask", label: "What colors are available?" },
      ],
    }
  }
  if (q.includes("style") || q.includes("wear") || q.includes("pair") || q.includes("outfit")) {
    const advice =
      product.category === "Dresses"
        ? "Pair with minimalist leather slides or tailored boots, layered with an oversized blazer."
        : product.category === "Sets"
        ? "Wear as a coordinated monochrome statement, or mix the pieces separately with denim."
        : product.category === "Outerwear"
        ? "Layer over a soft tonal knit and straight-leg trousers for structured volume."
        : "Tuck into relaxed trousers or wear untucked over pleated shorts."
    return {
      text: `**Styling the ${product.name}:**\n\n${advice}\n\nAvailable in: **${product.colors.join(", ")}**.`,
      actions: [
        { type: "quick_ask", label: "How does the fit run?" },
        { type: "add_to_cart", label: "Add to Bag" },
      ],
    }
  }
  if (q.includes("color") || q.includes("colour") || q.includes("shade")) {
    return {
      text: `The ${product.name} is available in **${product.colors.length} options**: **${product.colors.join(", ")}**. All dyed with colorfast pigments.`,
      actions: [{ type: "quick_ask", label: "How does the fit run?" }],
    }
  }
  if (q.includes("price") || q.includes("cost") || q.includes("discount") || q.includes("sale")) {
    return {
      text: `Current price: **${formatRupees(product.price)}**${
        product.originalPrice
          ? ` (was ${formatRupees(product.originalPrice)}, save **${discount}%**)`
          : ""
      }. Includes complimentary standard shipping on eligible orders.`,
      actions: [{ type: "add_to_cart", label: "Add to Bag" }],
    }
  }
  if (q.includes("ship") || q.includes("delivery") || q.includes("return") || q.includes("refund")) {
    return {
      text: `📦 **Shipping & Returns:**\n\n• Free standard shipping on orders over ${formatRupees(120)}.\n• 30-day hassle-free returns on unworn items with original tags.`,
      actions: [{ type: "quick_ask", label: "How does the fit run?" }],
    }
  }
  return {
    text: `The **${product.name}** is a ${product.category.toLowerCase()} in **${product.material}** with a **${product.fit}** fit for **${product.audience}** (${formatRupees(product.price)}).\n\nAsk me about sizing, fabric, styling, or returns!`,
    actions: [
      { type: "quick_ask", label: "How does the fit run?" },
      { type: "quick_ask", label: "How should I style this piece?" },
    ],
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProductChat({
  product,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ProductChatProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const setIsOpen = React.useCallback(
    (next: boolean) => {
      if (isControlled && controlledOnOpenChange) controlledOnOpenChange(next)
      else setInternalOpen(next)
    },
    [isControlled, controlledOnOpenChange]
  )

  const { user } = useAuth()
  const { addItem } = useCart()

  const [activeTab, setActiveTab] = React.useState<"ai" | "support">("ai")

  // ── AI tab state ────────────────────────────────────────────────────────────
  const [inputMessage, setInputMessage] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: `Hello! I'm your dedicated shopping assistant for the **${product.name}**.\n\nAsk me anything about its fit, fabric, sizing, or styling advice!`,
      timestamp: "Just now",
      suggestedActions: [
        { type: "quick_ask", label: "How does the fit run?" },
        { type: "quick_ask", label: "Fabric & Care instructions" },
        { type: "quick_ask", label: "How should I style this piece?" },
      ],
    },
  ])
  const aiBottomRef = React.useRef<HTMLDivElement>(null)

  // ── Live chat (support) tab state ────────────────────────────────────────────
  const [liveName, setLiveName] = React.useState(user?.name ?? "")
  const [liveEmail, setLiveEmail] = React.useState(user?.email ?? "")
  const [liveInput, setLiveInput] = React.useState("")
  const [liveSession, setLiveSession] = React.useState<LiveSession | null>(null)
  const [liveStarting, setLiveStarting] = React.useState(false)
  const [liveSending, setLiveSending] = React.useState(false)
  const [liveError, setLiveError] = React.useState("")
  const liveBottomRef = React.useRef<HTMLDivElement>(null)
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync user info
  React.useEffect(() => {
    if (user) {
      if (!liveName) setLiveName(user.name)
      if (!liveEmail) setLiveEmail(user.email)
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Restore session from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY(product.id))
    if (saved) {
      try {
        const parsed: LiveSession = JSON.parse(saved)
        if (parsed._id && parsed.status === "active") {
          setLiveSession(parsed)
        }
      } catch {
        // ignore
      }
    }
  }, [product.id])

  // Scroll AI chat to bottom
  React.useEffect(() => {
    if (isOpen && activeTab === "ai") {
      setTimeout(() => aiBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }, [isOpen, messages, isTyping, activeTab])

  // Scroll live chat to bottom
  React.useEffect(() => {
    if (isOpen && activeTab === "support") {
      setTimeout(() => liveBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }, [isOpen, liveSession?.messages.length, activeTab])

  // Poll for admin replies when session is active
  React.useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (!liveSession || liveSession.status !== "active") return

    pollRef.current = setInterval(async () => {
      try {
        const updated = await apiRequest<LiveSession>(
          `/api/chat/sessions/${encodeURIComponent(liveSession._id)}`
        )
        setLiveSession(updated)
        localStorage.setItem(SESSION_KEY(product.id), JSON.stringify(updated))
      } catch {
        // silently ignore poll failures
      }
    }, 3500)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [liveSession?._id, liveSession?.status, product.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── AI message send ─────────────────────────────────────────────────────────

  function handleSendMessage(textToSend?: string) {
    const text = (textToSend ?? inputMessage).trim()
    if (!text) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: "Just now",
    }
    setMessages((prev) => [...prev, userMsg])
    setInputMessage("")
    setIsTyping(true)

    const history = messages
      .slice(-8)
      .map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }))
    history.push({ role: "user", content: text })

    apiRequest<{ reply: string }>("/api/chat", {
      method: "POST",
      body: {
        messages: history,
        productContext: {
          name: product.name,
          category: product.category,
          audience: product.audience,
          material: product.material,
          fit: product.fit,
          sizes: product.sizes,
          colors: product.colors,
          price: product.price,
          originalPrice: product.originalPrice,
          description: product.description,
          details: product.details,
        },
      },
    })
      .then(({ reply }) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "assistant",
            text: reply,
            timestamp: "Just now",
            suggestedActions:
              reply.toLowerCase().includes("live chat") || reply.toLowerCase().includes("admin")
                ? [{ type: "quick_ask", label: "Switch to Live Chat →" }]
                : [
                    { type: "quick_ask", label: "How does the fit run?" },
                    { type: "quick_ask", label: "How should I style this piece?" },
                  ],
          },
        ])
      })
      .catch(() => {
        const response = generateAiFallback(text, product)
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "assistant",
            text: response.text,
            timestamp: "Just now",
            suggestedActions: response.actions,
          },
        ])
      })
      .finally(() => setIsTyping(false))
  }

  function handleActionClick(action: NonNullable<ChatMessage["suggestedActions"]>[number]) {
    if (action.type === "quick_ask") {
      if (action.label === "Switch to Live Chat →") {
        setActiveTab("support")
      } else {
        handleSendMessage(action.label)
      }
    } else if (action.type === "add_to_cart") {
      addItem({
        id: `${product.id}:${product.colors[0]}:${product.sizes[0]}`,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        alt: product.alt || product.name,
        color: product.colors[0],
        size: product.sizes[0],
      })
      setMessages((prev) => [
        ...prev,
        {
          id: `confirm-${Date.now()}`,
          sender: "assistant",
          text: `✓ Added **${product.name}** (${product.colors[0]}, Size ${product.sizes[0]}) to your bag!`,
          timestamp: "Just now",
        },
      ])
    }
  }

  // ── Live chat: start session ─────────────────────────────────────────────────

  async function handleStartChat(e: React.FormEvent) {
    e.preventDefault()
    setLiveError("")
    if (!liveName.trim() || !liveEmail.trim() || !liveInput.trim()) {
      setLiveError("Please fill in your name, email, and first message.")
      return
    }
    setLiveStarting(true)
    try {
      const session = await apiRequest<LiveSession>("/api/chat/sessions", {
        method: "POST",
        body: {
          productId: product.id,
          productName: product.name,
          customerName: liveName.trim(),
          customerEmail: liveEmail.trim(),
          message: liveInput.trim(),
          userId: user?.id ?? null,
        },
      })
      setLiveSession(session)
      setLiveInput("")
      localStorage.setItem(SESSION_KEY(product.id), JSON.stringify(session))
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : "Failed to start chat. Try again.")
    } finally {
      setLiveStarting(false)
    }
  }

  // ── Live chat: send follow-up ────────────────────────────────────────────────

  async function handleLiveSend(e: React.FormEvent) {
    e.preventDefault()
    if (!liveSession || !liveInput.trim() || liveSending) return
    setLiveSending(true)
    setLiveError("")
    try {
      const updated = await apiRequest<LiveSession>(
        `/api/chat/sessions/${encodeURIComponent(liveSession._id)}/messages`,
        { method: "POST", body: { text: liveInput.trim() } }
      )
      setLiveSession(updated)
      setLiveInput("")
      localStorage.setItem(SESSION_KEY(product.id), JSON.stringify(updated))
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : "Failed to send. Try again.")
    } finally {
      setLiveSending(false)
    }
  }

  function handleEndSession() {
    localStorage.removeItem(SESSION_KEY(product.id))
    setLiveSession(null)
    setLiveInput("")
    setLiveError("")
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const hasNewAdminReply =
    liveSession &&
    liveSession.messages.some((m) => m.sender === "admin" && !m.readByCustomer)

  return (
    <>
      {/* Floating Chat Trigger */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label={`Ask questions about ${product.name}`}
            className="group relative flex h-14 items-center gap-2.5 rounded-full bg-[#171512] px-5 text-sm font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-[#e94717] hover:shadow-[0_8px_30px_rgb(233,71,23,0.35)] active:scale-95"
          >
            <div className="relative flex size-7 items-center justify-center rounded-full bg-white/15 text-white transition group-hover:bg-white group-hover:text-[#e94717]">
              <Sparkles className="size-4 animate-pulse" />
            </div>
            <span className="hidden sm:inline">Ask about this product</span>
            <span className="inline sm:hidden">Chat</span>
            {/* Live indicator dot */}
            <span className="absolute -top-1 -right-1 flex size-3.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#e94717] opacity-75" />
              <span className="relative inline-flex size-3.5 rounded-full border-2 border-[#171512] bg-[#e94717]" />
            </span>
          </Button>
        </div>
      )}

      {/* Main Chat Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col border-l border-black/10 bg-[#fbf9f5] p-0 sm:max-w-md md:max-w-lg"
        >
          {/* Header */}
          <SheetHeader className="border-b border-black/10 bg-[#f7f3eb] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e94717] text-white shadow-sm font-serif text-lg font-bold">
                S
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <SheetTitle className="font-serif text-base font-semibold text-[#171512]">
                    Sati Product Assistant
                  </SheetTitle>
                  <Badge variant="secondary" className="bg-[#171512]/5 text-[10px] text-[#706c66]">
                    Live
                  </Badge>
                </div>
                <p className="text-xs text-[#706c66]">AI Stylist + Live Admin Chat</p>
              </div>
            </div>

            {/* Product mini-card */}
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-black/10 bg-white/90 p-2.5 shadow-xs">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-[#f2eee8]">
                <Image
                  src={product.image}
                  alt={product.alt || product.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[#171512]">{product.name}</p>
                <p className="text-[11px] text-[#706c66]">
                  {product.audience} · {product.category}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#e94717]">
                    {formatRupees(product.price)}
                  </span>
                  {product.originalPrice && (
                    <del className="text-[10px] text-[#8b867e]">
                      {formatRupees(product.originalPrice)}
                    </del>
                  )}
                </div>
              </div>
              <Badge className="shrink-0 rounded-full bg-[#171512] px-2 py-0.5 text-[10px] font-semibold text-white">
                {product.label}
              </Badge>
            </div>

            {/* Tab switcher */}
            <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-black/10 bg-black/5 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 font-semibold transition ${
                  activeTab === "ai"
                    ? "bg-white text-[#171512] shadow-xs"
                    : "text-[#706c66] hover:text-[#171512]"
                }`}
              >
                <Sparkles className="size-3.5 text-[#e94717]" />
                AI Stylist
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("support")}
                className={`relative flex items-center justify-center gap-1.5 rounded-md py-1.5 font-semibold transition ${
                  activeTab === "support"
                    ? "bg-white text-[#171512] shadow-xs"
                    : "text-[#706c66] hover:text-[#171512]"
                }`}
              >
                <MessageSquare className="size-3.5" />
                Live Chat
                {(hasNewAdminReply || (liveSession && !activeTab)) && (
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#e94717]" />
                )}
              </button>
            </div>
          </SheetHeader>

          {/* ── TAB 1: AI Stylist ── */}
          {activeTab === "ai" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <Message key={msg.id} align={msg.sender === "user" ? "end" : "start"}>
                    {msg.sender === "assistant" && (
                      <MessageAvatar className="size-7 rounded-full bg-[#e94717] text-[11px] font-bold text-white shadow-xs">
                        S
                      </MessageAvatar>
                    )}
                    {msg.sender === "user" && (
                      <MessageAvatar className="size-7 rounded-full bg-[#171512] text-white shadow-xs">
                        <User className="size-3.5" />
                      </MessageAvatar>
                    )}
                    <MessageContent className="max-w-[85%]">
                      <Bubble
                        variant={msg.sender === "user" ? "default" : "secondary"}
                        className={
                          msg.sender === "user"
                            ? "rounded-2xl rounded-tr-xs bg-[#171512] px-3.5 py-2.5 text-xs text-white leading-relaxed"
                            : "rounded-2xl rounded-tl-xs border border-black/10 bg-white px-3.5 py-2.5 text-xs text-[#171512] shadow-xs leading-relaxed"
                        }
                      >
                        <div className="space-y-1.5 whitespace-pre-wrap">
                          {msg.text.split("\n\n").map((para, i) => (
                            <p key={i}>
                              {para.split("**").map((chunk, j) =>
                                j % 2 === 1 ? (
                                  <strong key={j} className="font-semibold">
                                    {chunk}
                                  </strong>
                                ) : (
                                  chunk
                                )
                              )}
                            </p>
                          ))}
                        </div>
                        {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5 pt-1 border-t border-black/5">
                            {msg.suggestedActions.map((action, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleActionClick(action)}
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                                  action.type === "add_to_cart"
                                    ? "bg-[#e94717] text-white hover:bg-[#d03e12]"
                                    : "border border-black/15 bg-[#f7f3eb] text-[#171512] hover:border-[#e94717] hover:text-[#e94717]"
                                }`}
                              >
                                {action.type === "add_to_cart" ? (
                                  <ShoppingBag className="size-3" />
                                ) : (
                                  <HelpCircle className="size-3 text-[#e94717]" />
                                )}
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </Bubble>
                      <span className="px-1 text-[10px] text-[#8b867e]">{msg.timestamp}</span>
                    </MessageContent>
                  </Message>
                ))}

                {isTyping && (
                  <Message align="start">
                    <MessageAvatar className="size-7 rounded-full bg-[#e94717] text-[11px] font-bold text-white shadow-xs">
                      S
                    </MessageAvatar>
                    <MessageContent>
                      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-black/10 bg-white px-3.5 py-3 shadow-xs">
                        <span className="size-1.5 animate-bounce rounded-full bg-[#e94717]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-[#e94717] [animation-delay:0.15s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-[#e94717] [animation-delay:0.3s]" />
                      </div>
                    </MessageContent>
                  </Message>
                )}
                <div ref={aiBottomRef} />
              </div>

              {/* Suggested chips */}
              <div className="border-t border-black/10 bg-[#f7f3eb] px-4 py-2.5">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[#706c66]">
                  <span>Suggested Questions</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("support")}
                    className="text-[10px] text-[#e94717] hover:underline"
                  >
                    Chat with admin →
                  </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {QUICK_QUESTIONS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(chip)}
                      className="shrink-0 rounded-full border border-black/15 bg-white px-3 py-1 text-xs font-medium text-[#171512] transition hover:border-[#e94717] hover:text-[#e94717] active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="border-t border-black/10 bg-white p-3.5">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage() }}
                  className="flex items-center gap-2 rounded-full border border-black/15 bg-[#f7f3eb] px-3.5 py-1.5 focus-within:border-[#e94717] focus-within:ring-2 focus-within:ring-[#e94717]/20"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Ask about ${product.name}…`}
                    className="flex-1 bg-transparent text-xs text-[#171512] outline-none placeholder:text-[#8b867e]"
                  />
                  <Button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    size="icon-sm"
                    className="size-7 rounded-full bg-[#171512] text-white hover:bg-[#e94717] disabled:opacity-30"
                    aria-label="Send message"
                  >
                    <Send className="size-3" />
                  </Button>
                </form>
                <p className="mt-1.5 text-center text-[10px] text-[#8b867e]">
                  Powered by AI · Scoped to {product.name}
                </p>
              </div>
            </div>
          )}

          {/* ── TAB 2: Live Chat with Admin ── */}
          {activeTab === "support" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {!liveSession ? (
                /* ── Start a new session ── */
                <div className="flex-1 overflow-y-auto p-5">
                  {/* Info banner */}
                  <div className="mb-4 rounded-xl border border-black/10 bg-white p-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#171512]">
                      <MessageSquare className="size-4 text-[#e94717]" />
                      Live Chat with Our Team
                    </div>
                    <p className="mt-1 text-xs text-[#706c66] leading-relaxed">
                      Chat directly with the SATI team about <strong>{product.name}</strong> — sizing, custom orders, bulk enquiries, or anything the AI couldn&apos;t answer.
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600">
                      <Circle className="size-2 fill-current" />
                      Team typically replies within a few hours
                    </div>
                  </div>

                  <form onSubmit={handleStartChat} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#171512]">Your Name</label>
                      <input
                        type="text"
                        required
                        value={liveName}
                        onChange={(e) => setLiveName(e.target.value)}
                        placeholder="e.g. Maya Sharma"
                        className="mt-1.5 h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-xs text-[#171512] outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#171512]">Your Email</label>
                      <input
                        type="email"
                        required
                        value={liveEmail}
                        onChange={(e) => setLiveEmail(e.target.value)}
                        placeholder="e.g. you@example.com"
                        className="mt-1.5 h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-xs text-[#171512] outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#171512]">
                        Your first message
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={liveInput}
                        onChange={(e) => setLiveInput(e.target.value)}
                        placeholder={`What would you like to know about ${product.name}?`}
                        className="mt-1.5 w-full rounded-lg border border-black/15 bg-white p-3 text-xs text-[#171512] outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                      />
                    </div>

                    {liveError && (
                      <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-center text-xs text-red-600">
                        {liveError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={liveStarting}
                      className="h-11 w-full rounded-full bg-[#e94717] text-xs font-semibold text-white hover:bg-[#d03e12] disabled:opacity-50"
                    >
                      {liveStarting ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="size-3.5 animate-spin" />
                          Starting chat…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <MessageSquare className="size-3.5" />
                          Start Live Chat
                        </span>
                      )}
                    </Button>
                  </form>
                </div>
              ) : (
                /* ── Active chat thread ── */
                <>
                  {/* Thread header */}
                  <div className="flex items-center justify-between gap-3 border-b border-black/10 bg-[#f7f3eb] px-4 py-2.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${
                          liveSession.status === "active"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-zinc-300 bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        <Circle
                          className={`size-1.5 fill-current ${
                            liveSession.status === "active" ? "text-emerald-500" : "text-zinc-400"
                          }`}
                        />
                        {liveSession.status === "active" ? "Live — Admin can see this" : "Closed"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleEndSession}
                      className="flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1 text-[11px] text-[#706c66] hover:border-red-300 hover:text-red-500 transition"
                    >
                      <XCircle className="size-3" />
                      End & Clear
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 p-4">
                    {liveSession.messages.map((msg) => {
                      const isCustomer = msg.sender === "customer"
                      return (
                        <div key={msg._id} className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
                          {!isCustomer && (
                            <div className="mr-2 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e94717] text-[11px] font-bold text-white self-end">
                              S
                            </div>
                          )}
                          <div
                            className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                              isCustomer
                                ? "rounded-tr-xs bg-[#171512] text-white"
                                : "rounded-tl-xs border border-black/10 bg-white text-[#171512] shadow-xs"
                            }`}
                          >
                            {!isCustomer && (
                              <p className="mb-1 text-[10px] font-bold text-[#e94717]">SATI Team</p>
                            )}
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <p
                              className={`mt-1 text-right text-[10px] ${
                                isCustomer ? "text-white/50" : "text-[#8b867e]"
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })}

                    {/* Waiting indicator */}
                    {liveSession.status === "active" &&
                      liveSession.messages.at(-1)?.sender === "customer" && (
                        <div className="flex justify-start">
                          <div className="mr-2 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e94717] text-[11px] font-bold text-white self-end">
                            S
                          </div>
                          <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-black/10 bg-white px-3.5 py-3 text-xs text-[#8b867e] shadow-xs">
                            <RefreshCw className="size-3 animate-spin text-[#e94717]" />
                            Waiting for admin reply…
                          </div>
                        </div>
                      )}

                    {liveSession.status === "closed" && (
                      <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-[#f7f3eb] p-3 text-xs text-[#706c66]">
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                        This chat has been closed by the admin. Start a new chat if you have more questions.
                      </div>
                    )}

                    <div ref={liveBottomRef} />
                  </div>

                  {/* Input */}
                  {liveSession.status === "active" ? (
                    <div className="border-t border-black/10 bg-white p-3.5">
                      <form
                        onSubmit={handleLiveSend}
                        className="flex items-center gap-2 rounded-full border border-black/15 bg-[#f7f3eb] px-3.5 py-1.5 focus-within:border-[#e94717] focus-within:ring-2 focus-within:ring-[#e94717]/20"
                      >
                        <input
                          type="text"
                          value={liveInput}
                          onChange={(e) => setLiveInput(e.target.value)}
                          placeholder="Type a message to the SATI team…"
                          className="flex-1 bg-transparent text-xs text-[#171512] outline-none placeholder:text-[#8b867e]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleLiveSend(e)
                            }
                          }}
                        />
                        <Button
                          type="submit"
                          disabled={!liveInput.trim() || liveSending}
                          size="icon-sm"
                          className="size-7 rounded-full bg-[#171512] text-white hover:bg-[#e94717] disabled:opacity-30"
                          aria-label="Send message"
                        >
                          {liveSending ? (
                            <RefreshCw className="size-3 animate-spin" />
                          ) : (
                            <Send className="size-3" />
                          )}
                        </Button>
                      </form>
                      {liveError && (
                        <p className="mt-1 text-center text-[10px] text-red-500">{liveError}</p>
                      )}
                      <p className="mt-1.5 text-center text-[10px] text-[#8b867e]">
                        Messages are delivered live to the SATI admin dashboard
                      </p>
                    </div>
                  ) : (
                    <div className="border-t border-black/10 bg-white p-4">
                      <Button
                        type="button"
                        onClick={handleEndSession}
                        className="h-10 w-full rounded-full bg-[#171512] text-xs font-semibold text-white hover:bg-[#e94717]"
                      >
                        Start a New Chat
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
