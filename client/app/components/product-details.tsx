"use client"

import { useEffect, useState, type FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Lock,
  Star,
  ThumbsUp,
  PenLine,
  CheckCircle2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCart } from "@/app/components/cart-provider"
import { ProductChat } from "@/app/components/product-chat"
import { productBadgeClasses } from "@/lib/product-badges"
import { getProductGallery, type StoreProduct } from "@/lib/store-products"
import { useWishlist } from "@/lib/wishlist-store"
import { useAuth } from "@/app/components/auth-provider"
import { formatRupees } from "@/lib/currency"
import { getDiscountPercentage } from "@/lib/pricing"
import { reviewsApi, type ProductReview } from "@/lib/api"

const swatchColors: Record<string, string> = {
  Cobalt: "#2867b2",
  Rust: "#bd481f",
  Ivory: "#eee6d6",
  Ink: "#202124",
  Olive: "#777548",
  Orange: "#ee4c16",
}

function StarIcons({
  rating,
  max = 5,
  size = "md",
}: {
  rating: number
  max?: number
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-5",
  }
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: max }).map((_, i) => {
        const starIndex = i + 1
        const isFilled = starIndex <= Math.round(rating)
        return (
          <Star
            key={i}
            className={`${sizeClasses[size]} ${
              isFilled ? "fill-amber-400 text-amber-400" : "fill-transparent text-zinc-300"
            }`}
          />
        )
      })}
    </div>
  )
}

export function ProductDetails({ product }: { product: StoreProduct }) {
  const router = useRouter()
  const { addItem } = useCart()
  const wishlist = useWishlist()
  const { user, isAuthenticated } = useAuth()
  const [selectedColor, setSelectedColor] = useState(product.colors[0])
  const [selectedSize, setSelectedSize] = useState("M")
  const [isAdded, setIsAdded] = useState(false)
  const isFavorite = wishlist.productIds.includes(product.id)
  const [chatOpen, setChatOpen] = useState(false)

  const gallery = getProductGallery(product)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [currentRating, setCurrentRating] = useState(product.rating || 0)
  const [currentReviewCount, setCurrentReviewCount] = useState(product.reviewCount || 0)
  const [distribution, setDistribution] = useState<Record<number, number>>({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  })
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [isWritingReview, setIsWritingReview] = useState(false)
  const [helpfulSet, setHelpfulSet] = useState<Set<string>>(new Set())

  // New review form fields
  const [newRating, setNewRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [newTitle, setNewTitle] = useState("")
  const [newComment, setNewComment] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState("")
  const [reviewSuccess, setReviewSuccess] = useState(false)

  // Load reviews on mount
  useEffect(() => {
    let isMounted = true
    reviewsApi
      .getReviews(product.id)
      .then((data) => {
        if (!isMounted) return
        setReviews(data.reviews || [])
        if (data.stats) {
          setCurrentRating(data.stats.rating)
          setCurrentReviewCount(data.stats.reviewCount)
          setDistribution(data.stats.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })
        }
      })
      .catch((err) => {
        console.error("Failed to load reviews:", err)
      })
      .finally(() => {
        if (isMounted) setIsLoadingReviews(false)
      })

    return () => {
      isMounted = false
    }
  }, [product.id])

  // Sync user info into review form
  useEffect(() => {
    if (user?.name && !newUserName) setNewUserName(user.name)
    if (user?.email && !newUserEmail) setNewUserEmail(user.email)
  }, [user, newUserName, newUserEmail])

  async function handleReviewSubmit(e: FormEvent) {
    e.preventDefault()
    setReviewError("")
    if (!newUserName.trim()) {
      setReviewError("Please enter your name")
      return
    }
    if (!newComment.trim() || newComment.trim().length < 3) {
      setReviewError("Please provide a review (at least 3 characters)")
      return
    }

    setIsSubmittingReview(true)
    try {
      const res = await reviewsApi.createReview(product.id, {
        rating: newRating,
        title: newTitle.trim(),
        comment: newComment.trim(),
        userName: newUserName.trim(),
        userEmail: newUserEmail.trim(),
      })

      setReviews((prev) => [res.review, ...prev])
      setCurrentRating(res.stats.rating)
      setCurrentReviewCount(res.stats.reviewCount)
      setDistribution(res.stats.distribution)
      setReviewSuccess(true)
      setNewTitle("")
      setNewComment("")
      setTimeout(() => {
        setIsWritingReview(false)
        setReviewSuccess(false)
      }, 2500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to post review"
      setReviewError(msg)
    } finally {
      setIsSubmittingReview(false)
    }
  }

  function toggleHelpful(reviewId: string) {
    setHelpfulSet((prev) => {
      const next = new Set(prev)
      if (next.has(reviewId)) next.delete(reviewId)
      else next.add(reviewId)
      return next
    })
  }

  function handleColorSelect(color: string) {
    setSelectedColor(color)
    const matchIdx = gallery.findIndex(
      (img) => img.color && img.color.toLowerCase() === color.toLowerCase()
    )
    if (matchIdx !== -1) {
      setActiveImageIndex(matchIdx)
    }
  }

  function handlePrevImage() {
    setActiveImageIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))
  }

  function handleNextImage() {
    setActiveImageIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1))
  }

  const activeImage = gallery[activeImageIndex] || gallery[0] || { url: product.image, alt: product.alt }

  function addSelectedVariant() {
    addItem({
      id: `${product.id}:${selectedColor}:${selectedSize}`,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: activeImage.url || product.image,
      alt: activeImage.alt || product.alt,
      color: selectedColor,
      size: selectedSize,
    })
  }

  function handleAddToCart() {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    addSelectedVariant()
    setIsAdded(true)
    window.setTimeout(() => setIsAdded(false), 1800)
  }

  function handleBuyNow() {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    addSelectedVariant()
    router.push("/cart")
  }

  return (
    <main className="bg-white text-[#171512]">
      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8 lg:px-14">
        <Link
          href="/arrival-new"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#706c66] transition-colors hover:text-[#e94717]"
        >
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to shopping
        </Link>
      </div>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-6 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-14 lg:px-14">
        {/* Gallery column: Main Photo + Thumbnails rail */}
        <div className="flex flex-col gap-3">
          <div className="group relative aspect-[4/5] overflow-hidden bg-[#f2eee8] lg:aspect-[0.9/1]">
            <Image
              key={activeImage.url}
              src={activeImage.url}
              alt={activeImage.alt || product.alt}
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 54vw"
              className="object-cover transition-opacity duration-300"
            />
            <Badge
              className={`absolute left-4 top-4 rounded-none px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] ${productBadgeClasses[product.label]}`}
            >
              {product.label}
            </Badge>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={isFavorite}
              onClick={() => (isAuthenticated ? wishlist.toggle(product.id) : router.push("/login"))}
              className="absolute right-4 top-4 size-10 rounded-full border-0 bg-white hover:bg-white hover:text-[#e94717] shadow-sm"
            >
              <Heart
                aria-hidden="true"
                className={isFavorite ? "size-4 fill-[#e94717] text-[#e94717]" : "size-4"}
              />
              {!isAuthenticated && <Lock className="absolute -right-1 -top-1 size-4 text-[#e94717]" />}
            </Button>

            {/* Prev / Next Arrows */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrevImage()
                  }}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-white/85 text-[#171512] shadow-md backdrop-blur-sm transition opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-white hover:scale-105 active:scale-95 sm:size-10"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNextImage()
                  }}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-white/85 text-[#171512] shadow-md backdrop-blur-sm transition opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-white hover:scale-105 active:scale-95 sm:size-10"
                >
                  <ChevronRight className="size-5" />
                </button>

                {/* Counter Pill */}
                <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                  {activeImageIndex + 1} / {gallery.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails Row if multiple photos */}
          {gallery.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
              {gallery.map((img, idx) => (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`View photo ${idx + 1}`}
                  className={`group/thumb relative aspect-[4/5] w-16 sm:w-20 shrink-0 overflow-hidden rounded-sm transition ${
                    activeImageIndex === idx
                      ? "ring-2 ring-[#e94717] ring-offset-2 opacity-100"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || `${product.name} photo ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  {(img.color || img.size) && (
                    <span className="absolute bottom-1 inset-x-1 truncate rounded bg-black/75 px-1 py-0.5 text-[8px] font-medium text-white text-center">
                      {[img.color, img.size].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col py-1 lg:py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#e94717]">
            {product.audience} / {product.category}
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-[0.98] sm:text-5xl">{product.name}</h1>

          {/* Dynamic star rating link */}
          <a
            href="#reviews"
            className="mt-4 inline-flex w-fit items-center gap-2 text-xs hover:text-[#e94717] transition"
          >
            <StarIcons rating={currentRating} size="sm" />
            <span className="font-semibold text-[#171512]">{currentRating.toFixed(1)}</span>
            <span className="text-[#817c75]">({currentReviewCount} reviews)</span>
          </a>

          <div className="mt-5">
            <p className={`text-3xl font-semibold ${product.originalPrice ? "text-[#e94717]" : "text-[#171512]"}`}>
              {formatRupees(product.price)}
            </p>
            {product.originalPrice && (
              <div className="mt-1 flex items-center gap-2 text-xs">
                <del className="text-[#8b867e]">{formatRupees(product.originalPrice)}</del>
                {getDiscountPercentage(product.originalPrice, product.price) > 0 && (
                  <span className="font-semibold text-[#706c66]">
                    -{getDiscountPercentage(product.originalPrice, product.price)}%
                  </span>
                )}
              </div>
            )}
          </div>

          <p className="mt-5 max-w-lg text-sm leading-6 text-[#706c66]">{product.description}</p>

          <fieldset className="mt-7">
            <legend className="mb-3 text-xs font-semibold">
              Color <span className="font-normal text-[#817c75]">/ {selectedColor}</span>
            </legend>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Select ${color}`}
                  aria-pressed={selectedColor === color}
                  onClick={() => handleColorSelect(color)}
                  className={`size-8 rounded-full border-2 transition ${
                    selectedColor === color ? "border-[#171512] ring-2 ring-black/10" : "border-transparent"
                  }`}
                  style={{ backgroundColor: swatchColors[color] || "#202124" }}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-7">
            <legend className="mb-3 text-xs font-semibold">
              Size <span className="font-normal text-[#817c75]">/ {selectedSize}</span>
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  aria-pressed={selectedSize === size}
                  onClick={() => setSelectedSize(size)}
                  className={`flex h-11 min-w-14 items-center justify-center rounded-sm border px-3 text-xs font-semibold uppercase transition ${
                    selectedSize === size
                      ? "border-[#171512] bg-[#171512] text-white"
                      : "border-black/15 bg-white text-[#171512] hover:border-[#171512]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-[#706c66] underline cursor-pointer hover:text-[#171512]">
              Size guide
            </p>
          </fieldset>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={handleBuyNow}
              className="h-12 rounded-full bg-[#171512] text-xs font-semibold text-white hover:bg-[#e94717] transition"
            >
              Buy now <ArrowLeft aria-hidden="true" className="size-4 rotate-180" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddToCart}
              className="h-12 rounded-full border-black/20 bg-white text-xs font-semibold hover:border-[#e94717] hover:text-[#e94717] transition"
            >
              {isAdded ? <Check aria-hidden="true" className="size-4" /> : <ShoppingBag aria-hidden="true" className="size-4" />}
              {isAdded ? "Added to cart" : "Add to cart"}
            </Button>
          </div>
          <p role="status" className="sr-only">
            {isAdded ? `${product.name} added to cart` : ""}
          </p>

          <div className="mt-7 grid gap-3 border-y border-black/10 py-4 text-[12px] text-[#706c66] sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <Truck aria-hidden="true" className="size-4 text-[#e94717]" /> Free shipping over {formatRupees(120)}
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="size-4 text-[#e94717]" /> Easy 30-day returns
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <details className="group border-b border-black/10 pb-4" open>
              <summary className="cursor-pointer list-none text-xs font-semibold">
                Details & fit <span className="float-right text-[#e94717] group-open:hidden">+</span>
                <span className="float-right hidden text-[#e94717] group-open:inline">−</span>
              </summary>
              <p className="mt-3 text-xs leading-5 text-[#706c66]">
                {product.fit}. Available in sizes {product.sizes[0]}–{product.sizes.at(-1)}. {product.description}
              </p>
            </details>
            <details className="group border-b border-black/10 pb-4">
              <summary className="cursor-pointer list-none text-xs font-semibold">
                Materials & care <span className="float-right text-[#e94717] group-open:hidden">+</span>
                <span className="float-right hidden text-[#e94717] group-open:inline">−</span>
              </summary>
              <p className="mt-3 text-xs leading-5 text-[#706c66]">
                {product.material}. Wash inside out with similar colors and reshape while damp.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* ─── CUSTOMER REVIEWS & RATINGS SECTION ─── */}
      <section
        id="reviews"
        aria-labelledby="reviews-title"
        className="mx-auto max-w-7xl border-t border-black/10 px-5 py-12 sm:px-8 sm:py-16 lg:px-14"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-6">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#e94717]">
              Customer feedback
            </p>
            <h2 id="reviews-title" className="font-serif text-3xl sm:text-4xl font-semibold text-[#171512]">
              Reviews & ratings
            </h2>
          </div>
          <Button
            type="button"
            onClick={() => setIsWritingReview(!isWritingReview)}
            className="rounded-full bg-[#171512] px-6 text-xs font-semibold text-white hover:bg-[#e94717] transition shadow-xs"
          >
            <PenLine className="size-3.5 mr-2" />
            {isWritingReview ? "Cancel Review" : "Write a review"}
          </Button>
        </div>

        {/* Rating Overview Grid */}
        <div className="mt-8 grid gap-8 sm:grid-cols-[250px_minmax(0,1fr)] lg:gap-14">
          {/* Left Column: Big Rating & Breakdown */}
          <div className="space-y-5 rounded-2xl border border-black/8 bg-[#fdfcf9] p-6 shadow-xs">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-5xl font-bold tracking-tight text-[#171512]">
                  {currentRating.toFixed(1)}
                </span>
                <span className="text-xs font-medium text-[#817c75]">out of 5</span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <StarIcons rating={currentRating} size="lg" />
              </div>
              <p className="mt-2 text-xs text-[#706c66]">
                Based on {currentReviewCount} customer {currentReviewCount === 1 ? "rating" : "ratings"}
              </p>
            </div>

            {/* Star Distribution Breakdown Bars */}
            <div className="space-y-2 border-t border-black/8 pt-4">
              {[5, 4, 3, 2, 1].map((starNum) => {
                const count = distribution[starNum] || 0
                const percent = currentReviewCount > 0 ? Math.round((count / currentReviewCount) * 100) : 0
                return (
                  <div key={starNum} className="flex items-center gap-2 text-xs text-[#706c66]">
                    <span className="w-4 font-mono font-semibold text-[#171512]">{starNum}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/8">
                      <div
                        className="h-full rounded-full bg-[#e94717] transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[11px] text-zinc-500">{percent}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Write a Review Form OR List of Reviews */}
          <div className="space-y-6">
            {/* Interactive Review Form */}
            {isWritingReview && (
              <form
                onSubmit={handleReviewSubmit}
                className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition animate-in fade-in"
              >
                <div className="flex items-center justify-between border-b border-black/8 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#171512]">Share your experience</h3>
                  <span className="text-xs text-[#706c66]">Verified customer feedback</span>
                </div>

                {reviewSuccess ? (
                  <div className="my-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <span>Thank you! Your review has been published.</span>
                    </div>
                    <p className="mt-1 text-xs text-emerald-700">
                      Your ratings have updated the product's overall score.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {reviewError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        {reviewError}
                      </div>
                    )}

                    {/* Star Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-[#171512]">
                        Overall Rating <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 transition hover:scale-110 active:scale-95"
                              aria-label={`Rate ${star} star`}
                            >
                              <Star
                                className={`size-6 ${
                                  star <= (hoverRating || newRating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-transparent text-zinc-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-[#171512]">
                          {(hoverRating || newRating) === 5 && "Outstanding"}
                          {(hoverRating || newRating) === 4 && "Very Good"}
                          {(hoverRating || newRating) === 3 && "Average"}
                          {(hoverRating || newRating) === 2 && "Fair"}
                          {(hoverRating || newRating) === 1 && "Poor"}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-semibold text-[#171512]">Review Title</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g., Perfect drape and timeless silhouette"
                        maxLength={100}
                        className="mt-1 h-10 w-full rounded-lg border border-black/15 px-3 text-xs outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                      />
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-xs font-semibold text-[#171512]">
                        Your Review <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={4}
                        required
                        placeholder="Tell others about the fit, fabric feel, tailoring quality, and styling versatility..."
                        className="mt-1 w-full rounded-lg border border-black/15 p-3 text-xs outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                      />
                    </div>

                    {/* Reviewer Details */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-[#171512]">
                          Your Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="e.g. Suraj A."
                          required
                          className="mt-1 h-10 w-full rounded-lg border border-black/15 px-3 text-xs outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#171512]">
                          Email <span className="font-normal text-zinc-400">(optional)</span>
                        </label>
                        <input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="mt-1 h-10 w-full rounded-lg border border-black/15 px-3 text-xs outline-none focus:border-[#e94717] focus:ring-1 focus:ring-[#e94717]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsWritingReview(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="rounded-full bg-[#171512] px-6 text-xs font-semibold text-white hover:bg-[#e94717] transition"
                      >
                        {isSubmittingReview ? "Submitting review…" : "Submit Review"}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* List of Customer Reviews */}
            {isLoadingReviews ? (
              <div className="space-y-4">
                <div className="h-28 animate-pulse rounded-xl bg-[#f7f3eb]" />
                <div className="h-28 animate-pulse rounded-xl bg-[#f7f3eb]" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-2xl border border-black/8 bg-white p-8 text-center">
                <p className="font-serif text-lg font-semibold text-[#171512]">Be the first to review this item</p>
                <p className="mt-1 text-xs text-[#706c66]">
                  Share your experience with fit and styling to help the community.
                </p>
                <Button
                  type="button"
                  onClick={() => setIsWritingReview(true)}
                  className="mt-4 rounded-full bg-[#171512] px-5 text-xs font-semibold text-white hover:bg-[#e94717]"
                >
                  Write the first review
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-black/8 rounded-2xl border border-black/8 bg-white shadow-xs">
                {reviews.map((rev) => (
                  <div key={rev._id} className="p-6 transition hover:bg-[#fdfcf9]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StarIcons rating={rev.rating} size="sm" />
                        <span className="text-xs font-semibold text-[#171512]">{rev.userName}</span>
                        {rev.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="size-3" />
                            Verified Buyer
                          </span>
                        )}
                      </div>
                      <time className="text-[11px] text-zinc-400">
                        {new Date(rev.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    </div>

                    {rev.title && (
                      <h4 className="mt-2 font-serif text-sm font-bold text-[#171512]">{rev.title}</h4>
                    )}

                    <p className="mt-2 text-xs leading-5 text-[#504c46]">{rev.comment}</p>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-[#706c66]">
                      <button
                        type="button"
                        onClick={() => toggleHelpful(rev._id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 transition ${
                          helpfulSet.has(rev._id)
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-black/10 hover:border-black/30"
                        }`}
                      >
                        <ThumbsUp className="size-3" />
                        Helpful ({helpfulSet.has(rev._id) ? 1 : 0})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Floating unified AI Stylist & Store Support Chat Widget */}
      <ProductChat product={product} open={chatOpen} onOpenChange={setChatOpen} />
    </main>
  )
}