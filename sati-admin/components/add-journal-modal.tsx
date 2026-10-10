
"use client"

import { useEffect, useState } from "react"
import { X, ImagePlus, Upload, Trash2 } from "lucide-react"
import { adminApi, JournalPost } from "../lib/admin-api"

type AddJournalModalProps = {
  journal?: JournalPost | null
  onClose: () => void
  onSaved: () => void
}

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function AddJournalModal({
  journal,
  onClose,
  onSaved,
}: AddJournalModalProps) {
  const [form, setForm] = useState<Partial<JournalPost>>(
    journal
      ? {
          title: journal.title,
          category: journal.category,
          summary: journal.summary,
          paragraphs: journal.paragraphs || [],
          image: journal.image,
          alt: journal.alt,
          readTime: journal.readTime,
          active: journal.active,
        }
      : {
          title: "",
          category: "Style Guide",
          summary: "",
          paragraphs: [],
          image: "",
          alt: "",
          readTime: "5 min",
          active: true,
        }
  )

  const [paragraphsText, setParagraphsText] = useState(
    journal ? (journal.paragraphs || []).join("\n\n") : ""
  )

  // Selected image file and preview
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(
    journal?.image || ""
  )

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Clean up temporary preview URLs
  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    setError("")

    // Allow only image files
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.")
      event.target.value = ""
      return
    }

    // Limit the file size to 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.")
      event.target.value = ""
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))

    // Use the file name as a starting point for alt text
    setForm((previous) => ({
      ...previous,
      alt: previous.alt || file.name.replace(/\.[^/.]+$/, ""),
    }))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview("")
    setForm((previous) => ({
      ...previous,
      image: "",
      alt: "",
    }))

    const input = document.getElementById(
      "journal-image"
    ) as HTMLInputElement | null

    if (input) input.value = ""
  }

  async function uploadImage(file: File): Promise<string> {
    const data = new FormData()
    data.append("image", file)

    try {
      const result = await adminApi.journal.upload(data)
      if (!result.url) {
        throw new Error("Server did not return an image URL.")
      }
      return result.url
    } catch (error: any) {
      throw new Error(error.message || "Failed to upload image. Please try again.")
    }
  }

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setError("")

    if (!form.title?.trim()) {
      setError("Please enter a journal title.")
      return
    }

    if (!paragraphsText.trim()) {
      setError("Please enter the journal content.")
      return
    }

    setLoading(true)

    try {
      const slug = journal
        ? journal.slug
        : createSlug(form.title)

      // Upload the selected image before saving the article.
      let imageUrl = form.image || ""

      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const payload: Partial<JournalPost> = {
        ...form,
        title: form.title.trim(),
        paragraphs: paragraphsText
          .split(/\n\s*\n/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean),
        image: imageUrl,
        slug,
      }

      if (journal) {
        await adminApi.journal.update(slug, payload)
      } else {
        await adminApi.journal.create(payload)
      }

      onSaved()
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "h-11 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#e94717]"

  const textareaClass =
    "w-full resize-y rounded-lg border border-white/15 bg-zinc-950 px-3 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#e94717]"

  const labelClass =
    "mb-2 block text-sm font-semibold text-white"

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 p-3 py-6 backdrop-blur-[3px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="journal-form-title"
        className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
          <div>
            <h2
              id="journal-form-title"
              className="font-serif text-2xl text-white"
            >
              {journal ? "Edit Journal" : "Add Journal"}
            </h2>

            <p className="mt-1 text-xs text-zinc-400">
              Fill in the details for your story.
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
            {/* Article title */}
            <div className="sm:col-span-2">
              <label
                htmlFor="journal-title"
                className={labelClass}
              >
                Article title *
              </label>

              <input
                id="journal-title"
                required
                maxLength={150}
                value={form.title || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
                placeholder="Enter a compelling title"
                className={inputClass}
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="journal-category"
                className={labelClass}
              >
                Category
              </label>

              <select
                id="journal-category"
                value={form.category || "Style Guide"}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category: event.target.value,
                  })
                }
                className={inputClass}
              >
                <option>Style Guide</option>
                <option>Fashion</option>
                <option>Lifestyle</option>
                <option>Behind the Brand</option>
                <option>News</option>
                <option>Care Guide</option>
              </select>
            </div>

            {/* Read time */}
            <div>
              <label
                htmlFor="journal-readTime"
                className={labelClass}
              >
                Read Time
              </label>

              <input
                id="journal-readTime"
                value={form.readTime || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    readTime: event.target.value,
                  })
                }
                placeholder="5 min"
                className={inputClass}
              />
            </div>

            {/* Cover image upload */}
            <div className="sm:col-span-2">
              <label
                htmlFor="journal-image"
                className={labelClass}
              >
                Cover Image
              </label>

              <input
                id="journal-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
              />

              {imagePreview ? (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
                  <div className="relative h-48 sm:h-64">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt={form.alt || "Cover preview"}
                      className="size-full object-contain"
                    />

                    <button
                      type="button"
                      onClick={removeImage}
                      aria-label="Remove cover image"
                      className="absolute right-3 top-3 flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">
                        {imageFile?.name || "Current cover image"}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {imageFile
                          ? `${(imageFile.size / (1024 * 1024)).toFixed(2)} MB`
                          : "Existing image"}
                      </p>
                    </div>

                    <label
                      htmlFor="journal-image"
                      className="shrink-0 cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-800"
                    >
                      Change
                    </label>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="journal-image"
                  className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-zinc-950/70 px-5 py-8 text-center transition hover:border-[#e94717] hover:bg-zinc-950"
                >
                  <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#e94717]/15 text-[#e94717]">
                    <ImagePlus size={24} />
                  </div>

                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Upload size={16} />
                    Click to upload an image
                  </span>

                  <span className="mt-2 text-xs text-zinc-400">
                    PNG, JPG, WEBP or other image formats
                  </span>

                  <span className="mt-1 text-xs text-zinc-500">
                    Maximum file size: 5 MB
                  </span>
                </label>
              )}
            </div>

            {/* Alt text */}
            <div className="sm:col-span-2">
              <label
                htmlFor="journal-alt"
                className={labelClass}
              >
                Image Alt Text
              </label>

              <input
                id="journal-alt"
                value={form.alt || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    alt: event.target.value,
                  })
                }
                placeholder="Image description for accessibility"
                className={inputClass}
              />
            </div>

            {/* Summary */}
            <div className="sm:col-span-2">
              <label
                htmlFor="journal-summary"
                className={labelClass}
              >
                Short description
              </label>

              <textarea
                id="journal-summary"
                rows={2}
                maxLength={300}
                value={form.summary || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    summary: event.target.value,
                  })
                }
                placeholder="Write a short introduction for your article..."
                className={textareaClass}
              />

              <p className="mt-1 text-right text-[11px] text-zinc-400">
                {(form.summary || "").length}/300
              </p>
            </div>

            {/* Article content */}
            <div className="sm:col-span-2">
              <label
                htmlFor="journal-paragraphs"
                className={labelClass}
              >
                Article Content (Separate paragraphs with a blank line) *
              </label>

              <textarea
                id="journal-paragraphs"
                required
                rows={10}
                value={paragraphsText}
                onChange={(event) =>
                  setParagraphsText(event.target.value)
                }
                placeholder="Write your article here..."
                className={textareaClass}
              />
            </div>

            {/* Publish toggle */}
            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!form.active}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      active: event.target.checked,
                    })
                  }
                  className="size-4 rounded border-white/20 bg-zinc-950 accent-[#e94717] focus:ring-[#e94717]"
                />

                <span className="text-sm font-semibold text-white">
                  Publish immediately
                </span>
              </label>

              <p className="ml-7 mt-1 text-xs text-zinc-400">
                If unchecked, this article will be saved as a draft.
              </p>
            </div>
          </div>

          {/* Error message */}
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
                ? imageFile
                  ? "Uploading & Saving..."
                  : "Saving..."
                : journal
                  ? "Save Changes"
                  : "Save Article"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

