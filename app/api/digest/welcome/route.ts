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

    console.log(`Processing welcome digest for user ID: ${userId}`)

    // Add a delay to ensure the user is fully created in the database
    await new Promise((resolve) => setTimeout(resolve, 10000)) // 10-second delay
    console.log(`Delay completed, proceeding with welcome digest for user ID: ${userId}`)

    // Get the user from the database
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) {
      console.error(`Error fetching user with ID ${userId}:`, userError)
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log(`Generating welcome digest for user: ${user.email}`)

    // Fetch news based on user preferences
    const articles = await fetchNewsForTopics(user.preferences.topics)

    if (articles.length === 0) {
      console.log(`No articles found for user ${userId} with topics: ${user.preferences.topics.join(", ")}`)
      return NextResponse.json({
        warning: `No articles found for topics: ${user.preferences.topics.join(", ")}`,
        timestamp: new Date().toISOString(),
      })
    }

    console.log(`Found ${articles.length} articles for user ${user.email}`)

    try {
      // Generate personalized digest with a welcome focus
      const { introduction, articles: summarizedArticles } = await generatePersonalizedDigest(
        articles,
        user.preferences,
        true, // isWelcomeDigest flag
        user.name, // Pass the user's name
      )

      console.log(`Generated welcome digest introduction for user ${user.email}`)

      // Save digest to database
      const digest = await saveDigest({
        userId: user.id,
        createdAt: new Date(),
        articles: summarizedArticles,
        summary: introduction,
      })

      console.log(`Saved welcome digest to database for user ${user.email}`)

      // Send email
      await sendDigestEmail(user as User, digest, true) // isWelcomeDigest flag

      console.log(`Successfully sent welcome digest to ${user.email}`)

      return NextResponse.json({
        success: true,
        message: `Welcome digest sent to ${user.email}`,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`Error generating or sending digest for user ${user.email}:`, error)
      throw error
    }
  } catch (error) {
    console.error("Error processing welcome digest:", error)
    return NextResponse.json(
      {
        error: "Failed to process welcome digest",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
