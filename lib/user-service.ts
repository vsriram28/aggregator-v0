import { supabase } from "./db"
import type { User } from "./db-schema"

// Get all users with a specific frequency preference
export async function getUsersByFrequency(frequency: "daily" | "weekly") {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("preferences->frequency", frequency)

    if (error) throw error
    return data as User[]
  } catch (error) {
    console.error("Error fetching users by frequency:", error)
    return [] // Return empty array instead of throwing
  }
}

// Get user count
export async function getUserCount() {
  try {
    const { count, error } = await supabase.from("users").select("*", { count: "exact", head: true })

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error("Error fetching user count:", error)
    return 0 // Return 0 instead of throwing
  }
}

// Get popular topics
export async function getPopularTopics(limit = 10) {
  try {
    const { data, error } = await supabase.from("users").select("preferences->topics")

    if (error) throw error

    // Count topic occurrences
    const topicCounts = new Map<string, number>()
    data.forEach((row) => {
      const topics = row.topics as string[]
      if (Array.isArray(topics)) {
        topics.forEach((topic) => {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
        })
      }
    })

    // Sort by count and return top N
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([topic, count]) => ({ topic, count }))
  } catch (error) {
    console.error("Error fetching popular topics:", error)
    return [] // Return empty array instead of throwing
  }
}
