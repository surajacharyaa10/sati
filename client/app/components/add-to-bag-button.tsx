"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ShoppingBag, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/app/components/cart-provider"
import { useAuth } from "@/app/components/auth-provider"
import type { StoreProduct } from "@/lib/store-products"

export function AddToBagButton({ product }: { product: StoreProduct }) {
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [wasAdded, setWasAdded] = useState(false)

  function handleAdd() {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      alt: product.alt,
    })
    setWasAdded(true)
    window.setTimeout(() => setWasAdded(false), 1400)
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleAdd}
      aria-label={wasAdded ? `${product.name} added to bag` : `Add ${product.name} to bag`}
      className="h-9 w-full rounded-full bg-[#171512] text-[12px] font-semibold text-white hover:bg-[#e94717]"
    >
      {wasAdded ? <Check aria-hidden="true" className="size-3.5" /> : <ShoppingBag aria-hidden="true" className="size-3.5" />}
      {wasAdded ? "Added to bag" : "Add to bag"}
      {!isAuthenticated && <Lock className="ml-1 size-3.5" />}
    </Button>
  )
}
