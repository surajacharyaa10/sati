import type { ProductBadgeLabel } from "@/lib/product-badges"

export type ProductCategory = "Sets" | "Dresses" | "Outerwear" | "Tops"
export type ProductAudience = "Women" | "Men"

export type StoreProduct = {
  id: string
  name: string
  audience: ProductAudience
  category: ProductCategory
  details: string
  description: string
  material: string
  fit: string
  sizes: string[]
  colors: string[]
  rating: number
  reviewCount: number
  price: number
  originalPrice?: number
  label: ProductBadgeLabel
  image: string
  alt: string
}

type StoreProductSeed = Omit<StoreProduct, "description" | "material" | "fit" | "sizes" | "colors" | "rating" | "reviewCount">

const productSeeds: StoreProductSeed[] = [
  { id: "mara-utility-set", name: "Mara Utility Set", audience: "Women", category: "Sets", details: "Women · 4 colors", price: 148, label: "New", image: "/assets/image3.jpeg", alt: "Model in a blue tailored outfit against a teal backdrop" },
  { id: "sienna-pinstripe", name: "Sienna Pinstripe", audience: "Women", category: "Sets", details: "Women · 4 colors", price: 100, originalPrice: 150, label: "Limited", image: "/assets/image8.jpeg", alt: "Models wearing colorful everyday pieces outdoors" },
  { id: "rio-weekend-shirt", name: "Rio Weekend Shirt", audience: "Men", category: "Tops", details: "Men · 4 colors", price: 94, label: "Bestseller", image: "/assets/image9.jpeg", alt: "Model wearing a relaxed green overshirt" },
  { id: "nova-wide-leg-set", name: "Nova Wide-Leg Set", audience: "Women", category: "Sets", details: "Women · 4 colors", price: 164, label: "New", image: "/assets/image10.jpeg", alt: "Model in a vivid red matching set" },
  { id: "atlas-wool-coat", name: "Atlas Wool Coat", audience: "Women", category: "Outerwear", details: "Outerwear · 4 colors", price: 208, label: "New", image: "/assets/image4.jpeg", alt: "Designer reviewing a new clothing silhouette in the studio" },
  { id: "oren-relaxed-set", name: "Oren Relaxed Set", audience: "Men", category: "Sets", details: "Sets · 4 colors", price: 132, originalPrice: 176, label: "Sale", image: "/assets/image7.jpeg", alt: "Models in colorful relaxed outfits outdoors" },
  { id: "calder-knit-polo", name: "Calder Knit Polo", audience: "Men", category: "Tops", details: "Tops · 3 colors", price: 82, label: "New", image: "/assets/image3.jpeg", alt: "Blue tailored look with a clean modern silhouette" },
  { id: "milo-linen-layer", name: "Milo Linen Layer", audience: "Men", category: "Tops", details: "Tops · 4 colors", price: 104, originalPrice: 130, label: "Bestseller", image: "/assets/image10.jpeg", alt: "Red outfit styled as a lightweight layered look" },
  { id: "ellis-day-dress", name: "Ellis Day Dress", audience: "Women", category: "Dresses", details: "Dresses · 3 colors", price: 138, label: "New", image: "/assets/image8.jpeg", alt: "Colorful fashion campaign outdoors" },
  { id: "remy-cropped-jacket", name: "Remy Cropped Jacket", audience: "Women", category: "Outerwear", details: "Outerwear · 2 colors", price: 172, label: "Limited", image: "/assets/image9.jpeg", alt: "Relaxed green shirt styled as light outerwear" },
  { id: "cleo-ribbed-dress", name: "Cleo Ribbed Dress", audience: "Women", category: "Dresses", details: "Dresses · 4 colors", price: 128, originalPrice: 160, label: "Sale", image: "/assets/image2.jpeg", alt: "Model in a vivid orange top outdoors" },
  { id: "sora-column-dress", name: "Sora Column Dress", audience: "Women", category: "Dresses", details: "Dresses · 4 colors", price: 118, originalPrice: 148, label: "Sale", image: "/assets/image1.jpeg", alt: "Maker sewing fabric in a clothing studio" },
  { id: "sol-ribbed-top", name: "Sol Ribbed Top", audience: "Men", category: "Tops", details: "Tops · 5 colors", price: 68, label: "Sale", image: "/assets/image5.jpeg", alt: "Garment maker working at a sewing machine" },
]

const categorySpecifications: Record<ProductCategory, { material: string; fit: string; description: string }> = {
  Sets: {
    material: "Cotton blend with a soft, breathable hand",
    fit: "Relaxed silhouette with an easy drape",
    description: "A versatile two-piece look made for movement. Wear the pieces together or style them separately for an easy everyday uniform.",
  },
  Dresses: {
    material: "Soft-touch fabric selected for all-day comfort",
    fit: "Easy fit with a clean, flattering line",
    description: "A considered one-and-done piece with a confident shape and thoughtful finish, ready for everyday plans and late finishes.",
  },
  Outerwear: {
    material: "Durable woven fabric with a comfortable lining",
    fit: "Layer-friendly fit with considered proportions",
    description: "A dependable layer built for changing weather, with practical details and a shape that works over your everyday favorites.",
  },
  Tops: {
    material: "Breathable cotton-rich fabric",
    fit: "Comfortable regular fit",
    description: "An easy essential with a little more character: comfortable against the skin, simple to layer, and made to be worn often.",
  },
}

const audienceColors: Record<ProductAudience, string[]> = {
  Women: ["Cobalt", "Rust", "Ivory", "Ink"],
  Men: ["Olive", "Ivory", "Rust", "Ink"],
}

const reviewStats: Record<string, { rating: number; reviewCount: number }> = {
  "mara-utility-set": { rating: 4.9, reviewCount: 42 },
  "sienna-pinstripe": { rating: 4.8, reviewCount: 26 },
  "rio-weekend-shirt": { rating: 4.9, reviewCount: 58 },
  "nova-wide-leg-set": { rating: 4.8, reviewCount: 31 },
  "atlas-wool-coat": { rating: 4.9, reviewCount: 19 },
  "oren-relaxed-set": { rating: 4.7, reviewCount: 36 },
  "calder-knit-polo": { rating: 4.8, reviewCount: 23 },
  "milo-linen-layer": { rating: 4.9, reviewCount: 47 },
  "ellis-day-dress": { rating: 4.8, reviewCount: 34 },
  "remy-cropped-jacket": { rating: 4.7, reviewCount: 16 },
  "cleo-ribbed-dress": { rating: 4.9, reviewCount: 28 },
  "sora-column-dress": { rating: 4.8, reviewCount: 39 },
  "sol-ribbed-top": { rating: 4.7, reviewCount: 21 },
}

export const storeProducts: StoreProduct[] = productSeeds.map((product) => ({
  ...product,
  ...categorySpecifications[product.category],
  sizes: ["XS", "S", "M", "L", "XL"],
  colors: audienceColors[product.audience],
  ...reviewStats[product.id],
}))