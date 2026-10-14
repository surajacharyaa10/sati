export type Currency = "NPR" | "GBP"

const rupeeFormatter = new Intl.NumberFormat("en-NP", {
  maximumFractionDigits: 0,
})

const poundFormatter = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatRupees(amount: number): string {
  if (amount == null || isNaN(amount)) return "Rs 0"
  return `Rs ${rupeeFormatter.format(amount)}`
}

export function formatPounds(amount: number): string {
  if (amount == null || isNaN(amount)) return "£0"
  // If integer, don't show trailing .00; if has decimals, show up to 2 digits
  const hasDecimals = amount % 1 !== 0
  return `£${amount.toLocaleString("en-GB", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

export function formatPrice(amount: number, currency: Currency = "NPR"): string {
  return currency === "GBP" ? formatPounds(amount) : formatRupees(amount)
}

export interface PricingProduct {
  price: number
  originalPrice?: number
  poundPrice?: number
  originalPoundPrice?: number
}

export interface ProductPriceInfo {
  currency: Currency
  price: number
  originalPrice?: number
  formattedPrice: string
  formattedOriginalPrice?: string
  discountPercentage: number
  hasDiscount: boolean
  secondaryPrice?: {
    currency: Currency
    price: number
    originalPrice?: number
    formattedPrice: string
    formattedOriginalPrice?: string
  }
}

export function getProductPriceInfo(
  product: PricingProduct,
  activeCurrency: Currency = "NPR",
): ProductPriceInfo {
  if (activeCurrency === "GBP" && product.poundPrice != null) {
    const price = product.poundPrice
    const originalPrice = product.originalPoundPrice
    const discount =
      originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0

    return {
      currency: "GBP",
      price,
      originalPrice,
      formattedPrice: formatPounds(price),
      formattedOriginalPrice: originalPrice ? formatPounds(originalPrice) : undefined,
      discountPercentage: discount,
      hasDiscount: discount > 0,
      secondaryPrice: {
        currency: "NPR",
        price: product.price,
        originalPrice: product.originalPrice,
        formattedPrice: formatRupees(product.price),
        formattedOriginalPrice: product.originalPrice ? formatRupees(product.originalPrice) : undefined,
      },
    }
  }

  // Fallback to NPR or if NPR is selected
  const price = product.price
  const originalPrice = product.originalPrice
  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0

  return {
    currency: "NPR",
    price,
    originalPrice,
    formattedPrice: formatRupees(price),
    formattedOriginalPrice: originalPrice ? formatRupees(originalPrice) : undefined,
    discountPercentage: discount,
    hasDiscount: discount > 0,
    secondaryPrice:
      product.poundPrice != null
        ? {
            currency: "GBP",
            price: product.poundPrice,
            originalPrice: product.originalPoundPrice,
            formattedPrice: formatPounds(product.poundPrice),
            formattedOriginalPrice: product.originalPoundPrice
              ? formatPounds(product.originalPoundPrice)
              : undefined,
          }
        : undefined,
  }
}