"use client"

import { useEffect, useState } from "react"
import { X, ImagePlus, Upload, Trash2, Plus } from "lucide-react"
import { adminApi, type Product } from "@/lib/admin-api"

type ProductImage = {
  preview: string
  file?: File
  alt: string
  size: string
  color: string
}

type Props = {
  product?: Product | null
  onClose: () => void
  onSaved: () => void
}

const SIZES_PRESET = ["XS", "S", "M", "L", "XL", "XXL"]
const COLORS_PRESET = [
  { label: "Black", hex: "#171512" },
  { label: "White", hex: "#f7f3eb" },
  { label: "Ivory", hex: "#ede8da" },
  { label: "Stone", hex: "#a8998a" },
  { label: "Rust", hex: "#e94717" },
  { label: "Navy", hex: "#1e2a4a" },
  { label: "Forest", hex: "#2d4a36" },
  { label: "Blush", hex: "#e8b4a0" },
]

export function ProductModal({ product, onClose, onSaved }: Props) {
  const isEdit = !!product

  const [name, setName] = useState(product?.name ?? "")
  const [productId, setProductId] = useState(product?.id ?? "")
  const [audience, setAudience] = useState<"Women" | "Men">(product?.audience ?? "Women")
  const [category, setCategory] = useState<"Sets" | "Dresses" | "Outerwear" | "Tops">(product?.category ?? "Sets")
  const [price, setPrice] = useState(product?.price ? String(product.price) : "")
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice ? String(product.originalPrice) : "")
  const [label, setLabel] = useState<"New" | "Limited" | "Bestseller" | "Sale">(product?.label ?? "New")
  const [stock, setStock] = useState(product?.stock != null ? String(product.stock) : "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [details, setDetails] = useState(product?.details ?? "")
  const [material, setMaterial] = useState(product?.material ?? "")
  const [fit, setFit] = useState(product?.fit ?? "")
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? [])
  const [colors, setColors] = useState<string[]>(product?.colors ?? [])
  const [sizeInput, setSizeInput] = useState("")
  const [colorInput, setColorInput] = useState("")
  const [active, setActive] = useState(product?.active ?? true)

  const [images, setImages] = useState<ProductImage[]>(() => {
    if (product?.images && product.images.length > 0) {
      return product.images.map((img) => ({
        preview: img.url,
        alt: img.alt ?? "",
        size: img.size ?? "",
        color: img.color ?? "",
      }))
    }
    if (product?.image) {
      return [{ preview: product.image, alt: product.alt ?? "", size: "", color: "" }]
    }
    return []
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Revoke blob preview URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.preview.startsWith("blob:")) URL.revokeObjectURL(img.preview)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Sizes ────────────────────────────────────────────────────────────────

  function toggleSize(s: string) {
    setSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }
  function addCustomSize() {
    const s = sizeInput.trim().toUpperCase()
    if (s && !sizes.includes(s)) setSizes((prev) => [...prev, s])
    setSizeInput("")
  }
  function removeSize(s: string) { setSizes((prev) => prev.filter((x) => x !== s)) }

  // ── Colors ───────────────────────────────────────────────────────────────

  function toggleColor(c: string) {
    setColors((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])
  }
  function addCustomColor() {
    const c = colorInput.trim()
    if (c && !colors.includes(c)) setColors((prev) => [...prev, c])
    setColorInput("")
  }
  function removeColor(c: string) { setColors((prev) => prev.filter((x) => x !== c)) }

  // ── Images ───────────────────────────────────────────────────────────────

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const valid = files.filter((f) => {
      if (!f.type.startsWith("image/")) { setError("Only image files are accepted."); return false }
      if (f.size > 5 * 1024 * 1024) { setError("Each image must be 5 MB or less."); return false }
      return true
    })
    const newImgs: ProductImage[] = valid.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      alt: f.name.replace(/\.[^/.]+$/, ""),
      size: "",
      color: "",
    }))
    setImages((prev) => [...prev, ...newImgs])
    e.target.value = ""
  }

  function updateImage(idx: number, patch: Partial<ProductImage>) {
    setImages((prev) => prev.map((img, i) => (i === idx ? { ...img, ...patch } : img)))
  }

  function removeImage(idx: number) {
    setImages((prev) => {
      const img = prev[idx]
      if (img?.preview.startsWith("blob:")) URL.revokeObjectURL(img.preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  async function uploadImage(file: File): Promise<string> {
    const data = new FormData()
    data.append("image", file)
    const result = await adminApi.products.upload(data)
    if (!result.url) throw new Error("Server did not return an image URL.")
    return result.url
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (!name.trim()) { setError("Please enter a product name."); return }
    if (!isEdit && !productId.trim()) { setError("Please enter a product ID."); return }
    if (!price || isNaN(Number(price))) { setError("Please enter a valid price."); return }
    if (images.length === 0) { setError("Please upload at least one product image."); return }

    setLoading(true)
    try {
      const resolved = await Promise.all(
        images.map(async (img) => {
          const url = img.file ? await uploadImage(img.file) : img.preview
          return { url, alt: img.alt, size: img.size, color: img.color }
        })
      )

      const payload: Partial<Product> = {
        name: name.trim(),
        audience,
        category,
        description: description.trim(),
        details: details.trim(),
        material: material.trim(),
        fit: fit.trim(),
        sizes,
        colors,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        label,
        stock: Number(stock) || 0,
        active,
        image: resolved[0].url,
        alt: resolved[0].alt,
        images: resolved,
      }

      if (isEdit) {
        await adminApi.products.update(product!.id, payload)
      } else {
        await adminApi.products.create({ ...payload, id: productId.trim() })
      }

      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  // ── Styles (matching journal modal exactly) ───────────────────────────────

  const inputClass =
    "h-11 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#e94717]"
  const textareaClass =
    "w-full resize-y rounded-lg border border-white/15 bg-zinc-950 px-3 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#e94717]"
  const labelClass = "mb-2 block text-sm font-semibold text-white"

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 p-3 py-6 backdrop-blur-[3px] sm:items-center sm:p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
          <div>
            <h2 id="product-form-title" className="font-serif text-2xl text-white">
              {isEdit ? "Edit Product" : "Add Product"}
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              {isEdit ? `Editing "${product!.name}"` : "Fill in the details for your new product."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close form"
            className="rounded-full p-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-7">

            {/* Product ID – add only */}
            {!isEdit && (
              <div className="sm:col-span-2">
                <label htmlFor="prod-id" className={labelClass}>Product ID *</label>
                <input
                  id="prod-id"
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="e.g. sati-linen-dress-001"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-zinc-500">Unique slug used in the database. Cannot be changed later.</p>
              </div>
            )}

            {/* Name */}
            <div className="sm:col-span-2">
              <label htmlFor="prod-name" className={labelClass}>Product Name *</label>
              <input
                id="prod-name"
                required
                maxLength={150}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Linen Wrap Dress"
                className={inputClass}
              />
            </div>

            {/* Audience */}
            <div>
              <label htmlFor="prod-audience" className={labelClass}>Audience</label>
              <select
                id="prod-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value as "Women" | "Men")}
                className={inputClass}
              >
                <option>Women</option>
                <option>Men</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="prod-category" className={labelClass}>Category</label>
              <select
                id="prod-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as "Sets" | "Dresses" | "Outerwear" | "Tops")}
                className={inputClass}
              >
                <option>Sets</option>
                <option>Dresses</option>
                <option>Outerwear</option>
                <option>Tops</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label htmlFor="prod-price" className={labelClass}>Price (₹) *</label>
              <input
                id="prod-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2999"
                className={inputClass}
              />
            </div>

            {/* Original Price */}
            <div>
              <label htmlFor="prod-orig-price" className={labelClass}>Original Price (₹)</label>
              <input
                id="prod-orig-price"
                type="number"
                min="0"
                step="0.01"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="3999 (if on sale)"
                className={inputClass}
              />
            </div>

            {/* Label */}
            <div>
              <label htmlFor="prod-label" className={labelClass}>Label</label>
              <select
                id="prod-label"
                value={label}
                onChange={(e) => setLabel(e.target.value as "New" | "Limited" | "Bestseller" | "Sale")}
                className={inputClass}
              >
                <option>New</option>
                <option>Limited</option>
                <option>Bestseller</option>
                <option>Sale</option>
              </select>
            </div>

            {/* Stock */}
            <div>
              <label htmlFor="prod-stock" className={labelClass}>Stock</label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label htmlFor="prod-description" className={labelClass}>Description</label>
              <textarea
                id="prod-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Main product description visible to customers..."
                className={textareaClass}
              />
            </div>

            {/* Details */}
            <div className="sm:col-span-2">
              <label htmlFor="prod-details" className={labelClass}>Product Details</label>
              <textarea
                id="prod-details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Key features, care instructions..."
                className={textareaClass}
              />
            </div>

            {/* Material */}
            <div>
              <label htmlFor="prod-material" className={labelClass}>Material</label>
              <input
                id="prod-material"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="100% Linen"
                className={inputClass}
              />
            </div>

            {/* Fit */}
            <div>
              <label htmlFor="prod-fit" className={labelClass}>Fit</label>
              <input
                id="prod-fit"
                value={fit}
                onChange={(e) => setFit(e.target.value)}
                placeholder="Regular / Relaxed / Slim"
                className={inputClass}
              />
            </div>

            {/* ── Sizes ── */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Sizes</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {SIZES_PRESET.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      sizes.includes(s)
                        ? "border-[#e94717] bg-[#e94717]/15 text-[#e94717]"
                        : "border-white/15 text-zinc-400 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
                {sizes.filter((s) => !SIZES_PRESET.includes(s)).map((s) => (
                  <span key={s} className="flex items-center gap-1 rounded-lg border border-[#e94717]/50 bg-[#e94717]/10 px-3 py-1.5 text-xs text-[#e94717]">
                    {s}
                    <button type="button" onClick={() => removeSize(s)} className="ml-1 opacity-70 hover:opacity-100"><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSize())}
                  placeholder="Custom size (e.g. One Size)"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={addCustomSize}
                  className="flex h-11 items-center gap-1.5 rounded-lg border border-white/15 bg-zinc-950 px-3 text-sm text-zinc-300 transition hover:border-white/30 hover:text-white"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {/* ── Colors ── */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Colors</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COLORS_PRESET.map(({ label: cLabel, hex }) => (
                  <button
                    key={cLabel}
                    type="button"
                    onClick={() => toggleColor(cLabel)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      colors.includes(cLabel)
                        ? "border-[#e94717] bg-[#e94717]/10 text-white"
                        : "border-white/15 text-zinc-400 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <span className="size-3 rounded-full border border-white/20 flex-shrink-0" style={{ background: hex }} />
                    {cLabel}
                  </button>
                ))}
                {colors.filter((c) => !COLORS_PRESET.map((p) => p.label).includes(c)).map((c) => (
                  <span key={c} className="flex items-center gap-1 rounded-lg border border-white/20 bg-zinc-800 px-3 py-1.5 text-xs text-white">
                    {c}
                    <button type="button" onClick={() => removeColor(c)} className="ml-1 opacity-70 hover:opacity-100"><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomColor())}
                  placeholder="Custom color name"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={addCustomColor}
                  className="flex h-11 items-center gap-1.5 rounded-lg border border-white/15 bg-zinc-950 px-3 text-sm text-zinc-300 transition hover:border-white/30 hover:text-white"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {/* ── Product Images ── */}
            <div className="sm:col-span-2">
              <label htmlFor="prod-images" className={labelClass}>
                Product Photos *
              </label>

              <input
                id="prod-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="sr-only"
              />

              {/* Existing images */}
              {images.length > 0 && (
                <div className="mb-3 space-y-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
                      <div className="flex items-stretch gap-3 p-3">
                        {/* Thumbnail */}
                        <div className="relative size-16 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.preview} alt={img.alt || "preview"} className="size-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-[#e94717] py-0.5 text-center text-[8px] font-bold uppercase tracking-wider text-white">
                              Primary
                            </span>
                          )}
                        </div>
                        {/* Meta fields */}
                        <div className="flex flex-1 flex-col gap-2 min-w-0">
                          <input
                            value={img.alt}
                            onChange={(e) => updateImage(idx, { alt: e.target.value })}
                            placeholder="Alt text"
                            className="h-8 w-full rounded-lg border border-white/10 bg-zinc-900 px-2.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#e94717]"
                          />
                          <div className="flex gap-2">
                            <select
                              value={img.size}
                              onChange={(e) => updateImage(idx, { size: e.target.value })}
                              className="h-8 flex-1 rounded-lg border border-white/10 bg-zinc-900 px-2 text-xs text-white outline-none focus:border-[#e94717]"
                            >
                              <option value="">No size tag</option>
                              {[...SIZES_PRESET, ...sizes.filter((s) => !SIZES_PRESET.includes(s))].map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <select
                              value={img.color}
                              onChange={(e) => updateImage(idx, { color: e.target.value })}
                              className="h-8 flex-1 rounded-lg border border-white/10 bg-zinc-900 px-2 text-xs text-white outline-none focus:border-[#e94717]"
                            >
                              <option value="">No color tag</option>
                              {colors.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          aria-label="Remove image"
                          className="self-start rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-900/30 hover:text-red-400"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload zone */}
              <label
                htmlFor="prod-images"
                className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-zinc-950/70 px-5 py-8 text-center transition hover:border-[#e94717] hover:bg-zinc-950"
              >
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#e94717]/15 text-[#e94717]">
                  <ImagePlus size={24} />
                </div>
                <span className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Upload size={16} />
                  {images.length > 0 ? "Add more photos" : "Click to upload photos"}
                </span>
                <span className="mt-2 text-xs text-zinc-400">PNG, JPG, WEBP · Multiple allowed · Max 5 MB each</span>
                <span className="mt-1 text-xs text-zinc-500">First photo becomes the primary listing image</span>
              </label>
            </div>

            {/* Publish toggle */}
            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="size-4 rounded border-white/20 bg-zinc-950 accent-[#e94717] focus:ring-[#e94717]"
                />
                <span className="text-sm font-semibold text-white">Publish immediately</span>
              </label>
              <p className="ml-7 mt-1 text-xs text-zinc-400">
                If unchecked, this product will be saved as a draft.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mx-5 mb-4 rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-300 sm:mx-7"
            >
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 bg-zinc-950 px-5 py-4 sm:px-7">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#e94717] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c83b14] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? images.some((img) => img.file)
                  ? "Uploading & Saving..."
                  : "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
