"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  BookOpen,
  Eye,
  FileText,
  CalendarDays,
  ImagePlus,
} from "lucide-react"
import { adminApi, JournalPost } from "../lib/admin-api"
import { AddJournalModal } from "./add-journal-modal"

export default function AdminJournalPage() {
  const [journals, setJournals] = useState<JournalPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJournal, setEditingJournal] = useState<JournalPost | null>(null)
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null)

  async function fetchJournals() {
    setLoading(true)
    try {
      const data = await adminApi.journal.list()
      setJournals(data)
    } catch (error) {
      console.error("Failed to load journals:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJournals()
  }, [])

  const filteredJournals = journals.filter((journal) => {
    const query = search.toLowerCase()

    const matchesSearch =
      journal.title.toLowerCase().includes(query) ||
      journal.category.toLowerCase().includes(query)

    let matchesFilter = true
    if (filter === "Published") matchesFilter = journal.active === true
    if (filter === "Draft") matchesFilter = journal.active === false

    return matchesSearch && matchesFilter
  })

  const publishedCount = journals.filter((journal) => journal.active).length
  const draftCount = journals.filter((journal) => !journal.active).length

  function openAddModal() {
    setEditingJournal(null)
    setModalOpen(true)
  }

  function openEditModal(journal: JournalPost) {
    setEditingJournal(journal)
    setModalOpen(true)
  }

  async function handleDelete() {
    if (!deleteSlug) return
    try {
      await adminApi.journal.delete(deleteSlug)
      await fetchJournals()
    } catch (error) {
      console.error("Failed to delete journal:", error)
    } finally {
      setDeleteSlug(null)
    }
  }

  return (
    <main className="admin-theme admin-dark min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-[#e94717] text-white">
              <BookOpen size={23} />
            </div>

            <div>
              <h1 className="font-serif text-2xl sm:text-3xl">Journal</h1>
              <p className="mt-1 text-xs text-zinc-400">SATI · Content management</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 sm:py-10">
        {/* Page title */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e94717]">
              Your stories, your voice
            </p>

            <h2 className="font-serif text-3xl sm:text-4xl">Manage Journal</h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
              Create, edit, and organize the stories published on your store.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e94717] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c83b14]"
          >
            <Plus size={18} />
            Add Journal
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-5 text-white">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Total articles</span>
              <FileText className="text-[#e94717]" size={21} />
            </div>

            <p className="mt-3 text-3xl font-semibold">{journals.length}</p>

            <p className="mt-1 text-xs text-zinc-400">All journal entries</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900 p-5 text-white">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Published</span>
              <Eye className="text-emerald-600" size={21} />
            </div>

            <p className="mt-3 text-3xl font-semibold">{publishedCount}</p>

            <p className="mt-1 text-xs text-zinc-400">Live articles</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900 p-5 text-white">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Drafts</span>
              <Pencil className="text-amber-600" size={21} />
            </div>

            <p className="mt-3 text-3xl font-semibold">{draftCount}</p>

            <p className="mt-1 text-xs text-zinc-400">Waiting to be published</p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-5 flex flex-col gap-4 rounded-xl border border-white/10 bg-zinc-900 p-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search journal articles..."
              className="h-11 w-full rounded-lg border border-white/15 bg-zinc-950 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#e94717]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {["All", "Published", "Draft"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  filter === item
                    ? "bg-white text-black"
                    : "border border-white/15 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Journal list */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900 text-white shadow-sm">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h3 className="font-semibold">All journal articles</h3>
            <span className="text-xs text-zinc-400">
              {filteredJournals.length} {filteredJournals.length === 1 ? "article" : "articles"}
            </span>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-zinc-400">Loading journals...</div>
          ) : filteredJournals.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <BookOpen size={35} className="mx-auto mb-4 text-zinc-500" />
              <h3 className="font-serif text-xl">No articles found</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Try a different search or create a new journal article.
              </p>
              <button
                type="button"
                onClick={openAddModal}
                className="mt-5 rounded-lg bg-[#e94717] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#c83b14]"
              >
                Add your first article
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-zinc-950 text-[11px] uppercase tracking-wider text-zinc-400">
                      <th className="px-5 py-4 font-semibold">Article</th>
                      <th className="px-4 py-4 font-semibold">Category</th>
                      <th className="px-4 py-4 font-semibold">Date</th>
                      <th className="px-4 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJournals.map((journal) => (
                      <tr key={journal.slug} className="border-b border-white/10 last:border-0 hover:bg-zinc-800/70">
                        <td className="px-5 py-4">
                          <div className="flex min-w-[240px] items-center gap-3">
                            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800">
                              {journal.image ? (
                                <img src={journal.image} alt="" className="size-full object-cover" />
                              ) : (
                                <ImagePlus size={21} className="text-zinc-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-1 text-sm font-semibold">{journal.title}</p>
                              <p className="mt-1 line-clamp-1 max-w-[280px] text-xs text-zinc-400">
                                {journal.summary || journal.slug}
                              </p>
                              <p className="mt-1 text-[11px] text-zinc-400">Admin</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200">
                            {journal.category}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-zinc-400">
                          {journal.createdAt ? new Date(journal.createdAt).toLocaleDateString() : ""}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium ${
                              journal.active
                                ? "bg-emerald-950 text-emerald-300"
                                : "bg-amber-950 text-amber-300"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                journal.active ? "bg-emerald-600" : "bg-amber-600"
                              }`}
                            />
                            {journal.active ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(journal)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-[#e94717] hover:text-[#e94717]"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteSlug(journal.slug)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-900 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-950"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile article cards */}
              <div className="divide-y divide-white/10 md:hidden">
                {filteredJournals.map((journal) => (
                  <div key={journal.slug} className="p-4">
                    <div className="flex gap-3">
                      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800">
                        {journal.image ? (
                          <img src={journal.image} alt="" className="size-full object-cover" />
                        ) : (
                          <ImagePlus size={24} className="text-zinc-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold leading-5">{journal.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">
                          {journal.summary}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] text-zinc-200">
                            {journal.category}
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                              journal.active
                                ? "bg-emerald-950 text-emerald-300"
                                : "bg-amber-950 text-amber-300"
                            }`}
                          >
                            {journal.active ? "Published" : "Draft"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-400">
                        <CalendarDays size={13} className="mr-1 inline" />
                        {journal.createdAt ? new Date(journal.createdAt).toLocaleDateString() : ""}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(journal)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-zinc-200"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteSlug(journal.slug)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-900 px-3 py-2 text-xs font-medium text-red-400"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <AddJournalModal
          journal={editingJournal}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false)
            fetchJournals()
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleteSlug && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 text-white shadow-2xl"
          >
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={23} />
            </div>

            <h2 id="delete-title" className="font-serif text-2xl">
              Delete this article?
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              This will permanently remove the journal entry from this
              browser's saved list. Make sure you want to continue.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteSlug(null)}
                className="rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}


    </main>
  )
}
