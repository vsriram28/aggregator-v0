import { createClient } from "@supabase/supabase-js"
import type { User, UserPreferences, NewsArticle, NewsDigest } from "./db-schema"

// Initialize Supabase client with proper error handling
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL environment variable")
}

if (!supabaseKey) {
  throw new Error("Missing SUPABASE_KEY environment variable")
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// User management
export async function createUser(email: string, name: string, preferences: UserPreferences) {
  const { data, error } = await supabase.from("users").insert([{ email, name, preferences }]).select()

  if (error) throw error
  return data?.[0] as User
}

// Update the getUserByEmail function to handle not found errors properly
export async function getUserByEmail(email: string) {
  const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

  if (error) {
    if (error.code === "PGRST116") {
      // PGRST116 is the error code for "Results contain 0 rows"
      throw new Error("User not found")
    }
    throw error
  }

  return data as User
}

export async function updateUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
  const { data, error } = await supabase.from("users").update({ preferences }).eq("id", userId).select()

  if (error) throw error
  return data?.[0] as User
}

// News article management
export async function saveArticles(articles: Omit<NewsArticle, "id">[]) {
  const { data, error } = await supabase.from("articles").insert(articles).select()

  if (error) throw error
  return data as NewsArticle[]
}

export async function getArticlesByTopics(topics: string[], limit = 20) {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .containedBy("topics", topics)
    .order("publishedAt", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as NewsArticle[]
}

// Digest management
export async function saveDigest(digest: Omit<NewsDigest, "id">) {
  const { data, error } = await supabase.from("digests").insert([digest]).select()

  if (error) throw error
  return data?.[0] as NewsDigest
}

export async function getDigestsByUserId(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from("digests")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as NewsDigest[]
}
