import { apiRequest } from "@/lib/api"

export type JournalPost = {
  slug: string
  category: string
  title: string
  summary: string
  readTime: string
  image: string
  alt: string
  paragraphs: string[]
  createdAt?: string
  updatedAt?: string
}

export async function fetchJournalPosts(): Promise<JournalPost[]> {
  const posts = await apiRequest<JournalPost[]>("/api/journal")
  return posts
}

export async function fetchJournalPostBySlug(slug: string): Promise<JournalPost | null> {
  try {
    const post = await apiRequest<JournalPost>(`/api/journal/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    })
    return post
  } catch {
    return null
  }
}