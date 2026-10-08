export type ProductBadgeLabel = "New" | "Limited" | "Bestseller" | "Sale"

export const productBadgeClasses: Record<ProductBadgeLabel, string> = {
  New: "border-transparent bg-[#e94717] text-white hover:bg-[#e94717]",
  Limited: "border-transparent bg-[#171512] text-white hover:bg-[#171512]",
  Bestseller: "border-[#d8c7a5] bg-[#f7f3eb] text-[#5d4a2e] hover:bg-[#f7f3eb]",
  Sale: "border-transparent bg-[#fae5dd] text-[#c43d17] hover:bg-[#fae5dd]",
}