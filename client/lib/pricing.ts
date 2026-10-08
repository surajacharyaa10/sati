export function getDiscountPercentage(originalPrice: number | undefined, salePrice: number) {
  if (!originalPrice || originalPrice <= salePrice) return 0
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
}