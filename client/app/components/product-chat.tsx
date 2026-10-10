"use client"

import * as React from "react"
import Image from "next/image"
import {
  MessageSquare,
  Sparkles,
  Send,
  User,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Mail,
  RefreshCw,
  Info,
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

interface ProductChatProps {
  product: StoreProduct
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSelectColor?: (color: string) => void
  onSelectSize?: (size: string) => void
}

const QUICK_QUESTIONS = [
  "How does the fit run?",
  "What fabric & care is needed?",
  "How should I style this piece?",
  "What colors & sizes are available?",
  "What is the return & shipping policy?",
]

// Local fallback AI response generator (used when backend AI is unavailable)
function generateAiFallback(query: string, product: StoreProduct): { text: string; actions?: ChatMessage["suggestedActions"] } {
  const q = query.toLowerCase()
  const discount = product.originalPrice ? getDiscountPercentage(product.originalPrice, product.price) : 0

  // 1. Sizing / Fit
  if (
    q.includes("fit") ||
    q.includes("size") ||
    q.includes("sizing") ||
    q.includes("measure") ||
    q.includes("true to size") ||
    q.includes("tight") ||
    q.includes("loose")
  ) {
    return {
      text: `The ${product.name} is designed with a **${product.fit}**.\n\nAvailable sizes range from **${product.sizes[0]}** to **${product.sizes.at(-1)}** (${product.sizes.join(", ")}). It fits true to Sati's contemporary tailoring. If you prefer a more relaxed drape, consider sizing up one step.`,
      actions: [
        { type: "quick_ask", label: "What fabric is it made of?" },
        { type: "add_to_cart", label: "Add to Bag" },
      ],
    }
  }

  // 2. Material / Fabric / Care
  if (
    q.includes("fabric") ||
    q.includes("material") ||
    q.includes("care") ||
    q.includes("wash") ||
    q.includes("dry") ||
    q.includes("cotton") ||
    q.includes("linen") ||
    q.includes("silk")
  ) {
    return {
      text: `The ${product.name} is crafted from **${product.material}**.\n\n**Care Instructions:** Wash inside-out in cold or lukewarm water with mild detergent. Reshape gently while damp and dry flat away from direct sunlight to preserve the texture and color vibrancy.`,
      actions: [
        { type: "quick_ask", label: "How should I style this piece?" },
        { type: "quick_ask", label: "What colors are available?" },
      ],
    }
  }

  // 3. Styling / Pairing
  if (
    q.includes("style") ||
    q.includes("wear") ||
    q.includes("match") ||
    q.includes("pair") ||
    q.includes("outfit") ||
    q.includes("look")
  ) {
    const stylingAdvice =
      product.category === "Dresses"
        ? "Pair with minimalist leather slides or tailored boots, layered with an oversized blazer for effortless transition from day to evening."
        : product.category === "Sets"
        ? "Wear as a coordinated monochrome statement, or style the top and bottom separately with crisp denim or neutral linen separates."
        : product.category === "Outerwear"
        ? "Layer over a soft tonal knit top and straight-leg trousers for structured volume."
        : "Tuck into relaxed trousers or wear untucked over pleated shorts for a modern silhouette."

    return {
      text: `**Styling the ${product.name}:**\n\n${stylingAdvice}\n\nAvailable in rich shades: **${product.colors.join(", ")}**.`,
      actions: [
        { type: "quick_ask", label: "How does the fit run?" },
        { type: "add_to_cart", label: "Add to Bag" },
      ],
    }
  }

  // 4. Colors & Varieties
  if (q.includes("color") || q.includes("colour") || q.includes("shade") || q.includes("variety")) {
    return {
      text: `The ${product.name} is currently offered in **${product.colors.length} palette options**: **${product.colors.join(", ")}**.\n\nAll colors are dyed with colorfast pigments to maintain saturation over time.`,
      actions: [
        { type: "quick_ask", label: "How does the fit run?" },
      ],
    }
  }

  // 5. Price / Discount / Sale
  if (
    q.includes("price") ||
    q.includes("cost") ||
    q.includes("discount") ||
    q.includes("sale") ||
    q.includes("cheap") ||
    q.includes("deal")
  ) {
    return {
      text: `The current price for ${product.name} is **${formatRupees(product.price)}**${
        product.originalPrice
          ? ` (reduced from ${formatRupees(product.originalPrice)}, giving you a **${discount}% savings**)`
          : ""
      }.\n\nThis piece includes our premium finish guarantee and complimentary standard shipping on eligible orders.`,
      actions: [
        { type: "add_to_cart", label: "Add to Bag" },
      ],
    }
  }

  // 6. Shipping & Return
  if (
    q.includes("ship") ||
    q.includes("delivery") ||
    q.includes("return") ||
    q.includes("exchange") ||
    q.includes("refund") ||
    q.includes("days")
  ) {
    return {
      text: `📦 **Shipping & Returns for ${product.name}:**\n\n• **Shipping:** Free standard shipping on orders over ${formatRupees(120)}.\n• **Returns & Exchanges:** We offer easy 30-day hassle-free returns on unworn items with original tags intact.`,
      actions: [
        { type: "quick_ask", label: "How does the fit run?" },
      ],
    }
  }

  // 7. General product details / description
  if (q.includes("what is") || q.includes("about") || q.includes("tell me") || q.includes("detail")) {
    return {
      text: `**${product.name}** (${product.audience} · ${product.category}):\n\n${product.description}\n\n• **Material:** ${product.material}\n• **Fit:** ${product.fit}\n• **Sizes:** ${product.sizes.join(", ")}\n• **Colors:** ${product.colors.join(", ")}`,
      actions: [
        { type: "quick_ask", label: "How does the fit run?" },
        { type: "quick_ask", label: "Fabric & Care instructions" },
      ],
    }
  }

  // Fallback: strictly focused on this product
  return {
    text: `Regarding the **${product.name}**: It's a ${product.category.toLowerCase()} crafted with **${product.material}** in a **${product.fit}** for **${product.audience}** (${formatRupees(product.price)}).\n\nFeel free to ask me about sizing, fabric care, pairing advice, or return policies for this specific item!`,
    actions: [
      { type: "quick_ask", label: "How does the fit run?" },
      { type: "quick_ask", label: "How should I style this piece?" },
    ],
  }
}

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
      if (isControlled && controlledOnOpenChange) {
        controlledOnOpenChange(next)
      } else {
        setInternalOpen(next)
      }
    },
    [isControlled, controlledOnOpenChange]
  )

  const { user, isAuthenticated } = useAuth()
  const { addItem } = useCart()

  const [activeTab, setActiveTab] = React.useState<"ai" | "support">("ai")
  const [inputMessage, setInputMessage] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)

  // Support inquiry form state
  const [inquiryName, setInquiryName] = React.useState(user?.name || "")
  const [inquiryEmail, setInquiryEmail] = React.useState(user?.email || "")
  const [inquiryMessage, setInquiryMessage] = React.useState("")
  const [isSubmittingInquiry, setIsSubmittingInquiry] = React.useState(false)
  const [inquirySuccess, setInquirySuccess] = React.useState(false)
  const [inquiryError, setInquiryError] = React.useState("")

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

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Keep user info in sync if logged in
  React.useEffect(() => {
    if (user) {
      if (!inquiryName) setInquiryName(user.name)
      if (!inquiryEmail) setInquiryEmail(user.email)
    }
  }, [user, inquiryName, inquiryEmail])

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }, [isOpen, messages, isTyping])

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

    // Build message history for API (only role/content pairs)
    const history = messages
      .slice(-8) // Keep recent context
      .map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }))
    history.push({ role: "user", content: text })

    // Try backend AI, fallback to local rule-based response
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
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "assistant",
          text: reply,
          timestamp: "Just now",
          // Suggest add-to-cart if response mentions sizing or colors
          suggestedActions: reply.toLowerCase().includes("bag") || reply.toLowerCase().includes("add")
            ? [{ type: "add_to_cart", label: "Add to Bag" }]
            : [
                { type: "quick_ask", label: "How does the fit run?" },
                { type: "quick_ask", label: "How should I style this piece?" },
              ],
        }
        setMessages((prev) => [...prev, assistantMsg])
      })
      .catch(() => {
        // Fallback to local rule-based AI
        const response = generateAiFallback(text, product)
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "assistant",
          text: response.text,
          timestamp: "Just now",
          suggestedActions: response.actions,
        }
        setMessages((prev) => [...prev, assistantMsg])
      })
      .finally(() => {
        setIsTyping(false)
      })
  }

  function handleActionClick(action: NonNullable<ChatMessage["suggestedActions"]>[number]) {
    if (action.type === "quick_ask") {
      handleSendMessage(action.label)
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
      const confirmMsg: ChatMessage = {
        id: `confirm-${Date.now()}`,
        sender: "assistant",
        text: `✓ I've added **${product.name}** (${product.colors[0]}, Size ${product.sizes[0]}) to your bag! You can review it anytime from your shopping cart.`,
        timestamp: "Just now",
      }
      setMessages((prev) => [...prev, confirmMsg])
    }
  }

  async function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault()
    setInquiryError("")
    if (!inquiryName.trim() || !inquiryEmail.trim() || !inquiryMessage.trim()) {
      setInquiryError("Please fill out your name, email, and question.")
      return
    }

    setIsSubmittingInquiry(true)
    try {
      await apiRequest(`/api/products/${encodeURIComponent(product.id)}/inquiry`, {
        method: "POST",
        body: {
          productName: product.name,
          customerName: inquiryName.trim(),
          customerEmail: inquiryEmail.trim(),
          message: inquiryMessage.trim(),
        },
      })
      setInquirySuccess(true)
      setInquiryMessage("")
    } catch (err) {
      setInquiryError(err instanceof Error ? err.message : "Failed to send inquiry. Please try again.")
    } finally {
      setIsSubmittingInquiry(false)
    }
  }

  return (
    <>
      {/* Floating Chat Trigger Button */}
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
            <span className="absolute -top-1 -right-1 flex size-3.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#e94717] opacity-75" />
              <span className="relative inline-flex size-3.5 rounded-full border-2 border-[#171512] bg-[#e94717]" />
            </span>
          </Button>
        </div>
      )}

      {/* Main Chat Sheet Component */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col border-l border-black/10 bg-[#fbf9f5] p-0 sm:max-w-md md:max-w-lg"
        >
          {/* Sheet Header */}
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
                    Live Scoped
                  </Badge>
                </div>
                <p className="text-xs text-[#706c66]">
                  Assisting with sizing, fabric, and styling
                </p>
              </div>
            </div>

            {/* Scoped Product Mini-Card Banner */}
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

            {/* Mode Switcher Tabs */}
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
                className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 font-semibold transition ${
                  activeTab === "support"
                    ? "bg-white text-[#171512] shadow-xs"
                    : "text-[#706c66] hover:text-[#171512]"
                }`}
              >
                <Mail className="size-3.5 text-[#706c66]" />
                Store Support
              </button>
            </div>
          </SheetHeader>

          {/* TAB 1: AI Stylist Chat Mode */}
          {activeTab === "ai" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Message History */}
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
                                j % 2 === 1 ? <strong key={j} className="font-semibold text-[#171512]">{chunk}</strong> : chunk
                              )}
                            </p>
                          ))}
                        </div>

                        {/* Interactive Suggestion Actions */}
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

                {/* Typing Indicator */}
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

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions Chips Carousel */}
              <div className="border-t border-black/10 bg-[#f7f3eb] px-4 py-2.5">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[#706c66]">
                  <span>Suggested Questions</span>
                  <span className="text-[10px] text-[#8b867e]">Tap to ask</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {QUICK_QUESTIONS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(chip)}
                      className="shrink-0 rounded-full border border-black/15 bg-white px-3 py-1 text-xs font-medium text-[#171512] transition hover:border-[#e94717] hover:bg-white hover:text-[#e94717] active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="border-t border-black/10 bg-white p-3.5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                  className="flex items-center gap-2 rounded-full border border-black/15 bg-[#f7f3eb] px-3.5 py-1.5 focus-within:border-[#e94717] focus-within:ring-2 focus-within:ring-[#e94717]/20"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Ask about ${product.name} (fit, fabric, style)…`}
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
                  Answers are personalized to {product.name}&apos;s specifications and care guide.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Store Support Inquiry Mode */}
          {activeTab === "support" && (
            <div className="flex flex-1 flex-col overflow-y-auto p-5">
              <div className="mb-4 rounded-xl border border-black/10 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#171512]">
                  <Info className="size-4 text-[#e94717]" />
                  Direct Product Inquiry
                </div>
                <p className="mt-1 text-xs text-[#706c66] leading-relaxed">
                  Have a specific question about customization, preorder, or bulk sizing for the <strong>{product.name}</strong>? Leave a message directly for our store team.
                </p>
              </div>

              {inquirySuccess ? (
                <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-medium text-[#171512]">
                    Inquiry Received!
                  </h3>
                  <p className="mt-1.5 max-w-xs text-xs text-[#706c66]">
                    Our support team has logged your inquiry regarding <strong>{product.name}</strong> and will get back to you shortly via email.
                  </p>
                  <Button
                    type="button"
                    onClick={() => {
                      setInquirySuccess(false)
                      setActiveTab("ai")
                    }}
                    className="mt-5 rounded-full bg-[#171512] px-6 text-xs text-white hover:bg-[#e94717]"
                  >
                    Back to AI Stylist
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#171512]">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="e.g. Maya Sharma"
                      className="mt-1.5 h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-xs text-[#171512] outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171512]">
                      Your Email
                    </label>
                    <input
                      type="email"
                      required
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      placeholder="e.g. you@example.com"
                      className="mt-1.5 h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-xs text-[#171512] outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171512]">
                      Your Question about {product.name}
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      placeholder={`Ask our stylists or team about sizing, alterations, shipping speed for ${product.name}…`}
                      className="mt-1.5 w-full rounded-lg border border-black/15 bg-white p-3 text-xs text-[#171512] outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                    />
                  </div>

                  {inquiryError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-center text-xs text-red-600">
                      {inquiryError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmittingInquiry}
                    className="h-11 w-full rounded-full bg-[#e94717] text-xs font-semibold text-white hover:bg-[#d03e12] disabled:opacity-50"
                  >
                    {isSubmittingInquiry ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="size-3.5 animate-spin" />
                        Submitting inquiry…
                      </span>
                    ) : (
                      "Send Message to Store Team"
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
