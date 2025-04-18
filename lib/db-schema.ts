// Database schema types
export type User = {
  id: string
  email: string
  name: string
  createdAt: Date
  preferences: UserPreferences
}

export type UserPreferences = {
  topics: string[]
  sources: string[]
  frequency: "daily" | "weekly"
  format: "short" | "detailed"
}

export type NewsArticle = {
  id: string
  title: string
  url: string
  source: string
  publishedAt: Date
  content: string
  summary?: string
  topics: string[]
}

export type NewsDigest = {
  id: string
  userId: string
  createdAt: Date
  articles: NewsArticle[]
  summary: string
}
