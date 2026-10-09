"use client"

import { useState } from "react"
import { Search, Plus, Trash2, Edit3, Check, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { Product } from "@/lib/admin-api"
import { adminApi } from "@/lib/admin-api"

export function ProductsManagement({
  products,
  onUpdate,
}: {
  products: Product[]
  onUpdate: () => void
}) {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<string>("")
  const [editStock, setEditStock] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string>("")

  const [form, setForm] = useState({
    id: "",
    name: "",
    audience: "Women" as "Women" | "Men",
    category: "Sets" as "Sets" | "Dresses" | "Outerwear" | "Tops",
    details: "",
    description: "",
    material: "",
    fit: "",
    sizes: "",
    colors: "",
    price: "",
    originalPrice: "",
    label: "New" as "New" | "Limited" | "Bestseller" | "Sale",
    image: "",
    alt: "",
    stock: "",
  })

  const categories = ["All", "Sets", "Dresses", "Outerwear", "Tops"]
  const productCategories = ["Sets", "Dresses", "Outerwear", "Tops"]
  const audiences = ["Women", "Men"]
  const labels = ["New", "Limited", "Bestseller", "Sale"]

  function resetForm() {
    setForm({
      id: "",
      name: "",
      audience: "Women",
      category: "Sets",
      details: "",
      description: "",
      material: "",
      fit: "",
      sizes: "",
      colors: "",
      price: "",
      originalPrice: "",
      label: "New",
      image: "",
      alt: "",
      stock: "",
    })
    setFormError("")
  }

  async function handleCreate() {
    setFormError("")
    if (!form.id.trim() || !form.name.trim() || !form.price || !form.image.trim()) {
      setFormError("ID, name, price and image are required")
      return
    }
    setCreating(true)
    try {
      await adminApi.products.create({
        id: form.id.trim(),
        name: form.name.trim(),
        audience: form.audience,
        category: form.category,
        details: form.details.trim(),
        description: form.description.trim(),
        material: form.material.trim(),
        fit: form.fit.trim(),
        sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
        colors: form.colors.split(",").map((s) => s.trim()).filter(Boolean),
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        label: form.label,
        image: form.image.trim(),
        alt: form.alt.trim(),
        stock: Number(form.stock) || 0,
      })
      setCreateOpen(false)
      resetForm()
      onUpdate()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create product")
    } finally {
      setCreating(false)
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search.toLowerCase())
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  async function handleSave(id: string) {
    try {
      setErrorMessage("")
      await adminApi.products.update(id, {
        price: Number(editPrice),
        stock: Number(editStock),
      })
      setEditingId(null)
      onUpdate()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update product")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Are you sure you want to delete product "${id}"?`)) return
    try {
      await adminApi.products.delete(id)
      onUpdate()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-serif text-2xl font-medium">Product Catalog</CardTitle>
            <CardDescription>Manage your store inventory, prices, and labels</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 rounded-lg"
              />
            </div>
            <Button
              onClick={() => setCreateOpen(true)}
              className="h-10 rounded-xl bg-[#e94717] hover:bg-[#d03e12] text-white gap-2"
            >
              <Plus className="size-4" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {errorMessage && <p className="mb-4 text-xs text-red-400">{errorMessage}</p>}

          <div className="flex gap-2 pb-4 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCategory === cat
                    ? "bg-[#e94717] text-white"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product ID / Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Price (₹)</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                    No products found matching your filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => {
                  const isEditing = editingId === p.id
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{p.name}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{p.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.category}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{p.audience}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="h-8 w-24 text-xs"
                          />
                        ) : (
                          <span className="font-semibold">₹{p.price}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            className="h-8 w-20 text-xs"
                          />
                        ) : (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {p.stock ?? 25} in stock
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            p.label === "New"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {p.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="icon" variant="ghost" onClick={() => handleSave(p.id)} className="size-8">
                              <Check className="size-4 text-emerald-600" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="size-8">
                              <X className="size-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(p.id)
                                setEditPrice(String(p.price))
                                setEditStock(String(p.stock ?? 25))
                              }}
                              className="size-8 hover:bg-muted"
                            >
                              <Edit3 className="size-4 text-muted-foreground" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(p.id)}
                              className="size-8 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
