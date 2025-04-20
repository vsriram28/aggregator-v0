import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { fetchNewsForTopics } from "@/lib/news-fetcher"
import { generatePersonalizedDigest } from "@/lib/llm-service"
import { sendDigestEmail } from "@/lib/email-service"
import { saveDigest } from "@/lib/db"
import type { User } from "@/lib/db-schema"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`Processing preferences updated digest for user ID: ${userId}`)

    // Get the user from the database
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) {
      console.error(`Error fetching user with ID ${userId}:`, userError)
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log(`Generating preferences updated digest for user: ${user.email}`)
    console.log("User preferences:", user.preferences)

    // Fetch news based on user's updated preferences
    const articles = await fetchNewsForTopics(
      user.preferences.topics,
      5, // articles per topic
      user.preferences.sources, // Pass the user's preferred sources
    )

    console.log(`Fetched ${articles.length} articles for user ${user.email}`)

    if (articles.length === 0) {
      console.log(`No articles found for user ${userId} with topics: ${user.preferences.topics.join(", ")}`)
      return NextResponse.json({
        warning: `No articles found for topics: ${user.preferences.topics.join(", ")}`,
        timestamp: new Date().toISOString(),
      })
    }

    // Log the first few articles for debugging
    console.log(
      "Sample articles:",
      articles.slice(0, 2).map((a) => ({ title: a.title, source: a.source })),
    )

    try {
      // Generate personalized digest with a preferences updated focus
      const { introduction, articles: summarizedArticles } = await generatePersonalizedDigest(
        articles,
        user.preferences,
        false, // Not a welcome digest
        user.name, // Pass the user's name
        true, // Is a preferences updated digest
      )

      console.log(`Generated preferences updated digest introduction for user ${user.email}`)
      console.log("Introduction:", introduction.substring(0, 100) + "...")

      // Save digest to database
      const digest = await saveDigest({
        userId: user.id,
        createdAt: new Date(),
        articles: summarizedArticles,
        summary: introduction,
      })

      console.log(`Saved preferences updated digest to database for user ${user.email}`)

      // Send email with preferences updated flag
      const emailResult = await sendDigestEmail(user as User, digest, false, true) // isPreferencesUpdated flag

      console.log(`Email sending result:`, emailResult)
      console.log(`Successfully sent preferences updated digest to ${user.email}`)

      return NextResponse.json({
        success: true,
        message: `Preferences updated digest sent to ${user.email}`,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`Error generating or sending digest for user ${user.email}:`, error)
      throw error
    }
  } catch (error) {
    console.error("Error processing preferences updated digest:", error)
    return NextResponse.json(
      {
        error: "Failed to process preferences updated digest",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
