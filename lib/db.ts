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
  console.log(`Looking up user with email: ${email}`)

  try {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error) {
      console.error(`Error fetching user by email ${email}:`, error)
      if (error.code === "PGRST116") {
        // PGRST116 is the error code for "Results contain 0 rows"
        throw new Error(`User not found with email: ${email}`)
      }
      throw error
    }

    if (!data) {
      throw new Error(`No data returned for email: ${email}`)
    }

    console.log(`Found user: ${data.id} with preferences:`, data.preferences)
    return data as User
  } catch (error) {
    console.error(`Error in getUserByEmail for ${email}:`, error)
    throw error
  }
}

export async function updateUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
  const { data, error } = await supabase.from("users").update({ preferences }).eq("id", userId).select()

  if (error) throw error
  return data?.[0] as User
}

// News article management
// Update the saveArticles function to be more robust with column handling
export async function saveArticles(articles: Omit<NewsArticle, "id">[]) {
  try {
    // First, check if any articles with the same URLs already exist
    const urls = articles.map((article) => article.url)
    const { data: existingArticles, error: checkError } = await supabase.from("articles").select("url").in("url", urls)

    if (checkError) throw checkError

    // Filter out articles that already exist
    const existingUrls = new Set(existingArticles?.map((a) => a.url) || [])
    const newArticles = articles.filter((article) => !existingUrls.has(article.url))

    if (newArticles.length === 0) {
      console.log("No new articles to save")
      return articles as NewsArticle[] // Return the original articles
    }

    // Insert new articles with explicit column mapping
    const { data, error } = await supabase
      .from("articles")
      .insert(
        newArticles.map((article) => {
          const publishDate = article.publishedAt || new Date()
          return {
            title: article.title,
            url: article.url,
            source: article.source,
            publishedAt: publishDate,
            published_at: publishDate,
            content: article.content,
            topics: article.topics || [],
            summary: article.summary || null,
          }
        }),
      )
      .select()

    if (error) {
      console.error("Error inserting articles:", error)
      throw error
    }

    // Return all articles (both existing and newly inserted)
    return articles as NewsArticle[]
  } catch (error) {
    console.error("Error saving articles:", error)
    // Return empty array instead of throwing to prevent the whole process from failing
    return [] as NewsArticle[]
  }
}

export async function getArticlesByTopics(topics: string[], limit = 20) {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .containedBy("topics", topics)
      .order("publishedAt", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as NewsArticle[]
  } catch (error) {
    console.error("Error getting articles by topics:", error)
    return [] // Return empty array instead of throwing
  }
}

// Digest management
// Update saveDigest to use only the user_id column name that exists in the database
export async function saveDigest(digest: Omit<NewsDigest, "id">) {
  try {
    const now = new Date()

    // Log the digest object for debugging
    console.log("Saving digest:", {
      user_id: digest.userId, // We'll convert userId to user_id
      created_at: now,
      articles: Array.isArray(digest.articles) ? `${digest.articles.length} articles` : typeof digest.articles,
      summary: digest.summary ? `${digest.summary.substring(0, 50)}...` : null,
    })

    const { data, error } = await supabase
      .from("digests")
      .insert([
        {
          user_id: digest.userId, // Use user_id instead of userId
          created_at: now,
          articles: digest.articles,
          summary: digest.summary,
        },
      ])
      .select()

    if (error) {
      console.error("Error in saveDigest SQL operation:", error)
      throw error
    }

    return data?.[0] as NewsDigest
  } catch (error) {
    console.error("Error saving digest:", error)
    throw error
  }
}

export async function getDigestsByUserId(userId: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from("digests")
      .select("*")
      .eq("user_id", userId) // Use user_id instead of userId
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as NewsDigest[]
  } catch (error) {
    console.error("Error getting digests by user ID:", error)
    return [] // Return empty array instead of throwing
  }
}
