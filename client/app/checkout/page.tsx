"use client"

import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  CreditCard,
  Loader2,
  AlertCircle,
  Zap,
  MapPin,
  Phone,
  ChevronDown,
  Globe,
  Building2,
  Home,
  Check,
  Truck,
  Mail,
  User,
} from "lucide-react"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { Button } from "@/components/ui/button"
import { useCart } from "@/app/components/cart-provider"
import { useAuth } from "@/app/components/auth-provider"
import { formatRupees, formatPrice, formatPounds } from "@/lib/currency"
import { useCurrency } from "@/lib/currency-context"
import { paymentApi, apiRequest, apiBaseUrl, type EsewaConfig } from "@/lib/api"
import type { StoreProduct } from "@/lib/store-products"

function submitEsewaForm(config: EsewaConfig) {
  if (!config.form_url) {
    throw new Error("Missing eSewa gateway form URL in configuration")
  }

  const form = document.createElement("form")
  form.method = "POST"
  form.action = config.form_url

  const fields: Record<string, string | number> = {
    amount: config.amount,
    failure_url: config.failure_url,
    product_delivery_charge: config.product_delivery_charge,
    product_service_charge: config.product_service_charge,
    product_code: config.product_code,
    signature: config.signature,
    signed_field_names: config.signed_field_names,
    success_url: config.success_url,
    tax_amount: config.tax_amount,
    total_amount: config.total_amount,
    transaction_uuid: config.transaction_uuid,
  }

  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement("input")
    input.type = "hidden"
    input.name = key
    input.value = String(value)
    form.appendChild(input)
  })

  document.body.appendChild(form)
  form.submit()
}

function PaymentMethodButton({
  id,
  selected,
  disabled,
  onClick,
  logo,
  label,
  description,
  badge,
}: {
  id: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
  logo: React.ReactNode
  label: string
  description: string
  badge?: string
}) {
  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full text-left rounded-xl border-2 px-5 py-4 transition-all duration-200 ${
        disabled
          ? "border-black/5 bg-[#faf8f5] opacity-50 cursor-not-allowed"
          : selected
          ? "border-[#171512] bg-[#171512]/5 shadow-sm"
          : "border-black/10 bg-white hover:border-black/25 hover:bg-[#f7f3eb]/50"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold transition-colors ${
            disabled ? "bg-black/10 text-[#8e8a83]" : selected ? "bg-[#171512]" : "bg-black/15"
          }`}
        >
          {logo}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold ${selected ? "text-[#171512]" : "text-[#3a3631]"}`}>{label}</p>
            {badge && (
              <span className="rounded bg-black/5 px-1.5 py-0.5 text-[9px] font-semibold text-[#706c66] uppercase">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-[#9a958e] leading-snug">{description}</p>
        </div>
        <div
          className={`ml-auto h-4 w-4 shrink-0 rounded-full border-2 transition-all ${
            disabled ? "border-black/10" : selected ? "border-[#171512] bg-[#171512]" : "border-black/20"
          }`}
        >
          {selected && (
            <div className="h-full w-full rounded-full border-2 border-white" />
          )}
        </div>
      </div>
    </button>
  )
}

const REGIONS_BY_COUNTRY: Record<"Nepal" | "United Kingdom", string[]> = {
  Nepal: [
    "Bagmati Province (Kathmandu, Lalitpur, etc.)",
    "Gandaki Province (Pokhara, etc.)",
    "Koshi Province (Biratnagar, Dharan, etc.)",
    "Lumbini Province (Butwal, Bhairahawa, etc.)",
    "Madhesh Province (Birgunj, Janakpur, etc.)",
    "Karnali Province (Surkhet, etc.)",
    "Sudurpashchim Province (Dhangadhi, etc.)",
  ],
  "United Kingdom": [
    "England",
    "Scotland",
    "Wales",
    "Northern Ireland",
    "Greater London",
    "South East England",
    "North West England",
    "West Midlands",
    "Yorkshire and the Humber",
  ],
}

// ─── Checkout content ────────────────────────────────────────────────────────
function CheckoutContent() {
  const { items: cartItems, itemCount: cartItemCount, hasLoaded: cartHasLoaded } = useCart()
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Buy Now query parameters
  const isBuyNow = searchParams.get("buyNow") === "true"
  const directProductId = searchParams.get("productId")
  const directSize = searchParams.get("size") || undefined
  const directColor = searchParams.get("color") || undefined
  const directQuantity = Math.max(1, Number(searchParams.get("quantity")) || 1)

  const [directProduct, setDirectProduct] = useState<StoreProduct | null>(null)
  const [directLoading, setDirectLoading] = useState(isBuyNow)
  const [method, setMethod] = useState<"stripe" | "esewa">("stripe")

  // Daraz-style delivery information fields
  const [fullName, setFullName] = useState<string>("")
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [emailAddress, setEmailAddress] = useState<string>("")
  const [buildingHouse, setBuildingHouse] = useState<string>("")
  const [colonyLandmark, setColonyLandmark] = useState<string>("")

  const [country, setCountry] = useState<"Nepal" | "United Kingdom">("Nepal")
  const [region, setRegion] = useState<string>("Bagmati Province (Kathmandu, Lalitpur, etc.)")
  const [city, setCity] = useState<string>("")
  const [area, setArea] = useState<string>("")
  const [detailedAddress, setDetailedAddress] = useState<string>("")

  const [deliveryLabel, setDeliveryLabel] = useState<"OFFICE" | "HOME">("HOME")
  const [isSaved, setIsSaved] = useState<boolean>(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { currency: storeCurrency, setCurrency } = useCurrency()

  // Prefill user details if signed in
  useEffect(() => {
    if (user) {
      if (user.name && !fullName) setFullName(user.name)
      if (user.email && !emailAddress) setEmailAddress(user.email)
      if (user.phoneNumber && !phoneNumber) setPhoneNumber(user.phoneNumber)
      if (user.country === "UK") {
        setCountry("United Kingdom")
        setRegion(REGIONS_BY_COUNTRY["United Kingdom"][0])
        setCurrency("GBP")
        setMethod("stripe")
      } else if (user.country === "Nepal") {
        setCountry("Nepal")
        setRegion(REGIONS_BY_COUNTRY["Nepal"][0])
        setCurrency("NPR")
      }
    }
  }, [user])

  function handleCountryChange(newCountry: "Nepal" | "United Kingdom") {
    setCountry(newCountry)
    setRegion(REGIONS_BY_COUNTRY[newCountry][0])
    if (newCountry === "United Kingdom") {
      setCurrency("GBP")
      setMethod("stripe")
    } else {
      setCurrency("NPR")
    }
  }

  function handleSaveAddress() {
    if (!fullName.trim()) {
      setError("Please enter your full name.")
      return
    }
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number.")
      return
    }
    if (!city.trim()) {
      setError("Please enter your city.")
      return
    }
    if (!buildingHouse.trim() && !detailedAddress.trim()) {
      setError("Please enter your building / house number or street address.")
      return
    }
    setError(null)
    setIsSaved(true)
  }

  // Fetch product for direct Buy Now if requested
  useEffect(() => {
    if (isBuyNow && directProductId) {
      setDirectLoading(true)
      apiRequest<StoreProduct>(`/api/products/${encodeURIComponent(directProductId)}`)
        .then((prod) => setDirectProduct(prod))
        .catch((err) => {
          console.error("Failed to load Buy Now product:", err)
          setError("Failed to load product details for direct purchase.")
        })
        .finally(() => setDirectLoading(false))
    }
  }, [isBuyNow, directProductId])

  const isUk = country === "United Kingdom" || storeCurrency === "GBP"
  const currentCurrency = isUk ? "GBP" : "NPR"

  // Determine active items: either single product or user's bag
  const activeItems = isBuyNow
    ? directProduct
      ? [
          {
            id: `${directProduct.id}|${directSize ?? ""}|${directColor ?? ""}`,
            name: directProduct.name,
            price: directProduct.price,
            originalPrice: directProduct.originalPrice,
            poundPrice: directProduct.poundPrice,
            originalPoundPrice: directProduct.originalPoundPrice,
            image: directProduct.image,
            alt: directProduct.alt,
            size: directSize,
            color: directColor,
            quantity: directQuantity,
          },
        ]
      : []
    : cartItems

  const totalItemCount = isBuyNow ? (directProduct ? directQuantity : 0) : cartItemCount
  const subtotal = activeItems.reduce(
    (sum, item) => sum + (isUk && item.poundPrice != null ? item.poundPrice : item.price) * item.quantity,
    0
  )
  const totalSavings = activeItems.reduce((sum, item) => {
    const isPound = isUk && item.poundPrice != null
    const p = isPound ? item.poundPrice! : item.price
    const orig = (isPound ? item.originalPoundPrice : item.originalPrice) ?? p
    return sum + Math.max(orig - p, 0) * item.quantity
  }, 0)

  const isDataReady = isBuyNow ? !directLoading : cartHasLoaded

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-white text-[#171512]">
        <div className="flex flex-col items-center gap-5 px-5 py-20 text-center">
          <Lock className="size-10 text-[#e94717]" />
          <h1 className="font-serif text-2xl">Sign in to checkout</h1>
          <p className="max-w-sm text-sm text-[#706c66]">You need to be signed in to complete your purchase.</p>
          <Button
            className="h-11 rounded-full bg-[#171512] px-6 text-xs font-semibold text-white hover:bg-[#e94717]"
            onClick={() => router.push("/login")}
          >
            Sign in
          </Button>
        </div>
      </main>
    )
  }

  // Handle empty state (only applies to cart mode)
  if (!isBuyNow && cartHasLoaded && cartItems.length === 0) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-white text-[#171512]">
        <div className="flex flex-col items-center gap-5 px-5 py-20 text-center">
          <ShieldCheck className="size-10 text-[#e94717]" />
          <h1 className="font-serif text-2xl">Your bag is empty</h1>
          <p className="max-w-sm text-sm text-[#706c66]">Add some items to your bag before checking out.</p>
          <Link
            href="/arrival-new"
            className="inline-flex h-11 items-center rounded-full bg-[#171512] px-6 text-xs font-semibold text-white hover:bg-[#e94717]"
          >
            Shop new arrivals
          </Link>
        </div>
      </main>
    )
  }

  async function handlePayment() {
    setError(null)

    // Validate delivery inputs
    if (!fullName.trim()) {
      setError("Please enter your full name in delivery information.")
      return
    }
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number in delivery information.")
      return
    }
    if (!city.trim()) {
      setError("Please enter your city in delivery information.")
      return
    }
    if (!buildingHouse.trim() && !detailedAddress.trim()) {
      setError("Please enter your building / house number or address in delivery information.")
      return
    }

    setLoading(true)

    // Construct formatted address string matching Daraz fields
    const fullAddress = [
      fullName.trim() ? `Recipient: ${fullName.trim()}` : "",
      buildingHouse.trim(),
      colonyLandmark.trim(),
      area.trim(),
      detailedAddress.trim(),
      city.trim(),
      region,
      country,
      `[${deliveryLabel}]`,
    ]
      .filter(Boolean)
      .join(", ")

    const cleanPhone = phoneNumber.trim()

    try {
      if (isBuyNow && directProduct) {
        // ─── BUY NOW DIRECT PURCHASE (Cart is untouched) ───
        if (method === "stripe") {
          const unitPrice = isUk && directProduct.poundPrice != null ? directProduct.poundPrice : directProduct.price
          const products = [
            {
              name: directProduct.name,
              image: directProduct.image,
              price: unitPrice,
              quantity: directQuantity,
              poundPrice: directProduct.poundPrice,
            },
          ]
          const { url } = await paymentApi.stripeCheckout(
            products,
            {
              productId: directProduct.id,
              quantity: directQuantity,
              size: directSize,
              color: directColor,
            },
            fullAddress,
            cleanPhone,
            isUk ? "gbp" : "npr"
          )
          window.location.href = url
        } else {
          if (isUk) {
            throw new Error("eSewa is only available in Nepal (NPR). Please use Stripe (Card) for UK orders.")
          }
          // eSewa single product direct initialization
          const result = await paymentApi.esewaInitItem({
            productId: directProduct.id,
            quantity: directQuantity,
            size: directSize,
            color: directColor,
            totalPrice: directProduct.price * directQuantity,
            address: fullAddress,
            phoneNumber: cleanPhone,
          })
          if (!result.success) {
            throw new Error(result.order ? "Failed to initialize eSewa" : "Payment initialization failed")
          }
          submitEsewaForm(result.esewaConfig)
        }
      } else {
        // ─── STANDARD CART CHECKOUT ───
        if (method === "stripe") {
          const products = cartItems.map((item) => ({
            name: item.name,
            image: item.image,
            price: isUk && item.poundPrice != null ? item.poundPrice : item.price,
            quantity: item.quantity,
            poundPrice: item.poundPrice,
          }))
          const { url } = await paymentApi.stripeCheckout(
            products,
            undefined,
            fullAddress,
            cleanPhone,
            isUk ? "gbp" : "npr"
          )
          window.location.href = url
        } else {
          if (isUk) {
            throw new Error("eSewa is only available in Nepal (NPR). Please use Stripe (Card) for UK orders.")
          }
          const result = await paymentApi.esewaInitCart(fullAddress, cleanPhone)
          if (!result.success) {
            throw new Error("Failed to initialize eSewa payment")
          }
          submitEsewaForm(result.esewaConfig)
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed. Please try again."
      setError(msg)
      setLoading(false)
    }
  }

  const backLinkHref = isBuyNow && directProductId ? `/product/${directProductId}` : "/cart"
  const backLinkLabel = isBuyNow ? "Back to product" : "Back to bag"

  return (
    <main className="min-h-[60vh] bg-white text-[#171512]">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-14">

        {/* Header */}
        <div className="border-b border-black/10 pb-6 sm:pb-8">
          <Link
            href={backLinkHref}
            className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#706c66] hover:text-[#e94717] transition-colors"
          >
            <ArrowLeft className="size-3.5" /> {backLinkLabel}
          </Link>
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#e94717]">
              Secure checkout
            </p>
            {isBuyNow && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#171512] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                <Zap className="size-3 text-[#e94717]" /> Buy Now Single Item
              </span>
            )}
          </div>
          <div className="flex items-end justify-between gap-4">
            <h1 className="font-serif text-4xl leading-none sm:text-5xl">Payment</h1>
            {isDataReady && (
              <p className="text-xs text-[#817c75]">
                {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-10 lg:py-10">

          {/* LEFT SIDE — Daraz-style Delivery Information & Package */}
          <div className="space-y-6">

            {/* Delivery Information Card */}
            <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-black/8">
                <div className="flex items-center gap-2.5">
                  <MapPin className="size-5 text-[#e94717]" />
                  <h2 className="text-base sm:text-lg font-bold text-[#171512]">
                    Delivery Information
                  </h2>
                </div>
                {isSaved && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <Check className="size-3" /> Saved
                  </span>
                )}
              </div>

              {/* 2-Column Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

                {/* Column 1 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#706c66] mb-1.5">
                      Full name <span className="text-[#e94717]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="delivery-fullname"
                        type="text"
                        placeholder="Enter your first and last name"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value)
                          setIsSaved(false)
                        }}
                        className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 pl-9 text-xs text-[#171512] placeholder:text-[#a09c94] transition-colors focus:border-[#e94717] focus:outline-none focus:ring-1 focus:ring-[#e94717]"
                      />
                      <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8e8a83]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#706c66] mb-1.5">
                      Phone Number <span className="text-[#e94717]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="delivery-phone"
                        type="tel"
                        placeholder="Please enter your phone number"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value)
                          setIsSaved(false)
                        }}
                        className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 pl-9 text-xs text-[#171512] placeholder:text-[#a09c94] transition-colors focus:border-[#e94717] focus:outline-none focus:ring-1 focus:ring-[#e94717]"
                      />
                      <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8e8a83]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#706c66] mb-1.5">
                      Building / House No / Floor / Street <span className="text-[#e94717]">*</span>
                    </label>
                    <input
                      id="delivery-building"
                      type="text"
                      placeholder="Please enter"
                      value={buildingHouse}
                      onChange={(e) => {
                        setBuildingHouse(e.target.value)
                        setIsSaved(false)
                      }}
                      className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-xs text-[#171512] placeholder:text-[#a09c94] transition-colors focus:border-[#e94717] focus:outline-none focus:ring-1 focus:ring-[#e94717]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#706c66] mb-1.5">
                      Colony / Suburb / Locality / Landmark
                    </label>
                    <input
                      id="delivery-colony"
                      type="text"
                      placeholder="Please enter"
                      value={colonyLandmark}
                      onChange={(e) => {
                        setColonyLandmark(e.target.value)
                        setIsSaved(false)
                      }}
                      className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-xs text-[#171512] placeholder:text-[#a09c94] transition-colors focus:border-[#e94717] focus:outline-none focus:ring-1 focus:ring-[#e94717]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#706c66] mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="delivery-email"
                        type="email"
                        placeholder="Please enter your email"
                        value={emailAddress}
                        onChange={(e) => {
                          setEmailAddress(e.target.value)
                          setIsSaved(false)
                        }}
                        className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 pl-9 text-xs text-[#171512] placeholder:text-[#a09c94] transition-colors focus:border-[#e94717] focus:outline-none focus:ring-1 focus:ring-[#e94717]"
                      />
                      <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8e8a83]" />
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#706c66] mb-1.5">
                      Country <span className="text-[#e94717]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="delivery-country"
                        value={country}
                        onChange={(e) => {
                          handleCountryChange(e.target.value as "Nepal" | "United Kingdom")
                          setIsSaved(false)
                        }}
                        className="w-full appearance-none rounded-lg border border-black/15 bg-white px-3.5 py-2.5 pr-8 text-xs text-[#171512] font-medium transition-colors focus:border-[#e94717] focus:outline-none focus:ring-1 focus:ring-[#e94717]"
                      >
                        <option value="Nepal">🇳🇵 Nepal</option>
                        <option value="United Kingdom">🇬🇧 United Kingdom</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#8e8a83]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#706c66] mb-1.5">
                      Region <span className="text-[#e94717]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="delivery-region"
                        value={region}
                        onChange={(e) => {
                          setRegion(e.target.value)
                          setIsSaved(false)
                        }}
                        className="w-full appearance-none rounded-lg border border-black/15 bg-white px-3.5 py-2.5 pr-8 text-xs text-[#171512] font-medium transition-colors focus:border-[#e94717] focus:outline-none focus:ring-1 focus:ring-[#e94717]"
                      >
                        {REGIONS_BY_COUNTRY[country].map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#8e8a83]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#706c66] mb-1.5">
                      City <span className="text-[#e94717]">*</span>
                    </label>
                    <input
                      id="delivery-city"
                      type="text"
                      placeholder="Please enter your city"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value)
                        setIsSaved(false)
                      }}
                      className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-xs text-[#171512] placeholder:text-[#a09c94] transition-colors focus:border-[#e94717] focus:outline-none focus:ring-1 focus:ring-[#e94717]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#706c66] mb-1.5">
                      Area
                    </label>
                    <input
                      id="delivery-area"
                      type="text"
                      placeholder="Please enter your area"
                      value={area}
                      onChange={(e) => {
                        setArea(e.target.value)
                        setIsSaved(false)
                      }}
                      className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-xs text-[#171512] placeholder:text-[#a09c94] transition-colors focus:border-[#e94717] focus:outline-none focus:ring-1 focus:ring-[#e94717]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#706c66] mb-1.5">
                      Address
                    </label>
                    <input
                      id="delivery-detailed-address"
                      type="text"
                      placeholder="For Example: House# 123, Street# 123, ABC Road"
                      value={detailedAddress}
                      onChange={(e) => {
                        setDetailedAddress(e.target.value)
                        setIsSaved(false)
                      }}
                      className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-xs text-[#171512] placeholder:text-[#a09c94] transition-colors focus:border-[#e94717] focus:outline-none focus:ring-1 focus:ring-[#e94717]"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Label & Save Button (Daraz layout) */}
              <div className="mt-6 pt-5 border-t border-black/8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-[#706c66] mb-2">
                    Select a label for effective delivery:
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryLabel("OFFICE")}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold transition-all ${
                        deliveryLabel === "OFFICE"
                          ? "border-[#0e8ce4] bg-[#0e8ce4]/10 text-[#0e8ce4] shadow-xs"
                          : "border-black/15 bg-white text-[#706c66] hover:border-black/30"
                      }`}
                    >
                      <Building2 className="size-3.5" /> OFFICE
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryLabel("HOME")}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold transition-all ${
                        deliveryLabel === "HOME"
                          ? "border-[#e94717] bg-[#e94717]/10 text-[#e94717] shadow-xs"
                          : "border-black/15 bg-white text-[#706c66] hover:border-black/30"
                      }`}
                    >
                      <Home className="size-3.5" /> HOME
                    </button>
                  </div>
                </div>

                <div className="sm:self-end">
                  <button
                    type="button"
                    onClick={handleSaveAddress}
                    className="inline-flex items-center justify-center rounded-lg bg-[#0e8ce4] hover:bg-[#0c7ac6] text-white px-7 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                  >
                    SAVE
                  </button>
                </div>
              </div>
            </div>

            {/* Package 1 of 1 Card (Daraz layout) */}
            <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/8">
                <div className="flex items-center gap-2">
                  <Truck className="size-4 text-[#e94717]" />
                  <p className="text-xs font-bold uppercase tracking-wider text-[#171512]">
                    Package 1 of 1
                  </p>
                </div>
                <p className="text-[11px] text-[#8e8a83]">
                  Shipped by <span className="font-semibold text-[#171512]">SATI Official</span>
                </p>
              </div>

              <div className="rounded-xl border-2 border-[#171512] bg-[#faf8f5] p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-4 shrink-0 rounded-full border-4 border-[#171512] bg-white" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-[#171512]">Standard Delivery</p>
                      <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 uppercase">
                        Free
                      </span>
                    </div>
                    <p className="text-[11px] text-[#706c66] mt-0.5">
                      Estimated dispatch within 24 hours · Delivery in 2–4 business days
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 shrink-0">Free</span>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE — Payment Methods & Order Detail */}
          <aside className="space-y-6">

            {/* Select payment method */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/8">
                <p className="text-xs font-bold uppercase tracking-wider text-[#171512]">
                  Select payment method
                </p>
              </div>

              <div className="space-y-2.5">
                <PaymentMethodButton
                  id="payment-method-stripe"
                  selected={method === "stripe"}
                  onClick={() => setMethod("stripe")}
                  logo={<CreditCard className="size-5" />}
                  label="Pay with Card"
                  description={isUk ? "Visa, Mastercard, Amex · Charged in GBP (£)" : "Visa, Mastercard, Amex · Stripe"}
                  badge={isUk ? "GBP (£)" : "NPR"}
                />
                <PaymentMethodButton
                  id="payment-method-esewa"
                  selected={method === "esewa"}
                  disabled={isUk}
                  onClick={() => {
                    if (!isUk) setMethod("esewa")
                  }}
                  logo={
                    <div className="relative h-6 w-6 overflow-hidden rounded-full bg-white p-0.5">
                      <Image
                        src="/logo/esewa.png"
                        alt="eSewa"
                        fill
                        sizes="24px"
                        className="object-contain"
                      />
                    </div>
                  }
                  label="Pay with eSewa"
                  description={isUk ? "eSewa is only available in Nepal (NPR)" : "Nepal's trusted digital wallet"}
                  badge={isUk ? "Nepal Only" : "NPR"}
                />
              </div>

              {/* Method badge details */}
              {method === "stripe" && (
                <div className="rounded-lg border border-black/8 bg-[#f7f3eb] p-3 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                    <ShieldCheck className="size-3.5" /> Secured by Stripe · {isUk ? "GBP (£) Checkout" : "NPR Checkout"}
                  </div>
                  <p className="text-[11px] text-[#706c66]">
                    Redirected to Stripe hosted checkout. Card details never touch our servers.
                  </p>
                </div>
              )}

              {method === "esewa" && (
                <div className="rounded-lg border border-black/8 bg-[#f0faf4] p-3 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                    <ShieldCheck className="size-3.5" /> Secured by eSewa (Nepal NPR)
                  </div>
                  <p className="text-[11px] text-[#706c66]">
                    Redirected to eSewa gateway. Official printable receipt generated on completion.
                  </p>
                </div>
              )}
            </div>

            {/* Order Detail Summary Card */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/8">
                <p className="text-xs font-bold uppercase tracking-wider text-[#171512]">
                  Order Detail
                </p>
                {isBuyNow && (
                  <span className="text-[10px] font-semibold text-[#e94717] uppercase tracking-wider">
                    Single Item
                  </span>
                )}
              </div>

              {/* Items preview list */}
              <div className="divide-y divide-black/8 max-h-60 overflow-y-auto pr-1">
                {!isDataReady
                  ? Array.from({ length: 1 }).map((_, i) => (
                      <div key={i} className="flex gap-3 py-3">
                        <div className="h-14 w-11 shrink-0 animate-pulse rounded bg-black/10" />
                        <div className="flex-1 space-y-2 pt-1">
                          <div className="h-3 w-3/4 animate-pulse rounded bg-black/10" />
                          <div className="h-3 w-1/2 animate-pulse rounded bg-black/10" />
                        </div>
                      </div>
                    ))
                  : activeItems.map((item) => (
                      <div key={item.id} className="flex gap-3 py-3">
                        <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded bg-[#f7f3eb]">
                          <Image src={item.image} alt={item.alt || item.name} fill sizes="44px" className="object-cover" />
                        </div>
                        <div className="flex flex-1 items-start justify-between gap-2 min-w-0">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold leading-snug">{item.name}</p>
                            {(item.size || item.color) && (
                              <p className="mt-0.5 text-[10px] text-[#8e8a83]">
                                {[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(" · ")}
                              </p>
                            )}
                            <p className="mt-0.5 text-[10px] text-[#8e8a83]">Qty {item.quantity}</p>
                          </div>
                          <p className="shrink-0 text-xs font-semibold">
                            {formatPrice(
                              (isUk && item.poundPrice != null ? item.poundPrice : item.price) * item.quantity,
                              currentCurrency
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
              </div>

              {/* Price Calculation */}
              <div className="space-y-2.5 border-t border-black/8 pt-3 text-xs">
                <div className="flex justify-between text-[#706c66]">
                  <span>Items Total ({totalItemCount} {totalItemCount === 1 ? "Item" : "Items"})</span>
                  <span className="font-semibold text-[#171512]">{formatPrice(subtotal, currentCurrency)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-[#c43d17]">
                    <span>Discount Savings</span>
                    <span className="font-semibold">−{formatPrice(totalSavings, currentCurrency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#706c66]">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-emerald-700">Free</span>
                </div>
                <div className="flex justify-between border-t border-black/8 pt-3 text-sm font-bold text-[#171512]">
                  <span>Total</span>
                  <span className="text-[#e94717]">{formatPrice(subtotal, currentCurrency)}</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                  <p>{error}</p>
                </div>
              )}

              {/* Proceed to Pay Button (Daraz style orange/black) */}
              <Button
                id="btn-pay-now"
                type="button"
                onClick={handlePayment}
                disabled={loading || !isDataReady || activeItems.length === 0}
                className="h-12 w-full rounded-lg bg-[#e94717] hover:bg-[#d43c10] text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Processing {method === "stripe" ? "Stripe" : "eSewa"}…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="size-3.5" />
                    Proceed to Pay · {formatPrice(subtotal, currentCurrency)}
                  </span>
                )}
              </Button>

              <p className="text-center text-[10px] text-[#8e8a83] pt-1">
                By placing your order you agree to SATI{" "}
                <Link href="#" className="underline hover:text-[#171512]">Terms of Service</Link>{" "}
                and{" "}
                <Link href="#" className="underline hover:text-[#171512]">Privacy Policy</Link>.
              </p>

              {/* Trust badges */}
              <div className="border-t border-black/8 pt-3 flex items-center justify-around text-[10px] text-[#8e8a83]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3 text-emerald-600" /> SSL Encrypted
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3 text-emerald-600" /> 100% Authentic
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3 text-emerald-600" /> Easy Returns
                </span>
              </div>
            </div>

          </aside>
        </div>
      </section>
    </main>
  )
}

// ─── Exported page with Suspense ─────────────────────────────────────────────
export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-[#e94717]" />
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
      <Footer />
    </>
  )
}
