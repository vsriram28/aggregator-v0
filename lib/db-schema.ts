// Database schema types
export type User = {
  id: string
  email: string
  name: string
  created_at?: Date
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
  published_at?: Date
  content: string
  summary?: string
  topics: string[]
}

export type NewsDigest = {
  id: string
  userId: string // Keep this for TypeScript compatibility
  user_id: string // Add this to match the database column name
  createdAt?: Date // Keep this for TypeScript compatibility
  created_at: Date // Add this to match the database column name
  articles: NewsArticle[]
  summary: string
}
