import type { ProductBadgeLabel } from "@/lib/product-badges"

export type ProductCategory = "Sets" | "Dresses" | "Outerwear" | "Tops"
export type ProductAudience = "Women" | "Men"

export type StoreProduct = {
  id: string
  name: string
  audience: ProductAudience
  category: ProductCategory
  details: string
  price: number
  originalPrice?: number
  label: ProductBadgeLabel
  image: string
  alt: string
}

export const storeProducts: StoreProduct[] = [
  { id: "mara-utility-set", name: "Mara Utility Set", audience: "Women", category: "Sets", details: "Women · 4 colors", price: 148, label: "New", image: "/assets/image3.jpeg", alt: "Model in a blue tailored outfit against a teal backdrop" },
  { id: "sienna-pinstripe", name: "Sienna Pinstripe", audience: "Women", category: "Sets", details: "Women · 4 colors", price: 186, label: "Limited", image: "/assets/image8.jpeg", alt: "Models wearing colorful everyday pieces outdoors" },
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