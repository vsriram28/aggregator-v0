import { NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/db"
import { fetchNewsForTopics } from "@/lib/news-fetcher"
import { generatePersonalizedDigest } from "@/lib/llm-service"
import { sendDigestEmail } from "@/lib/email-service"
import { saveDigest } from "@/lib/db"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")
    const userId = searchParams.get("userId")

    if (!email && !userId) {
      return NextResponse.json({ error: "Email or userId parameter is required" }, { status: 400 })
    }

    // Get user by email or ID
    try {
      let user
      if (email) {
        user = await getUserByEmail(email)
      } else if (userId) {
        const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()
        if (error) throw error
        user = data
      }

      console.log(`Found user: ${user.id} (${user.email})`)

      // Fetch news based on user preferences
      const articles = await fetchNewsForTopics(
        user.preferences.topics,
        5, // articles per topic
        user.preferences.sources, // Pass the user's preferred sources
      )

      console.log(`Fetched ${articles.length} articles for topics: ${user.preferences.topics.join(", ")}`)

      if (articles.length === 0) {
        return NextResponse.json({
          warning: `No articles found for topics: ${user.preferences.topics.join(", ")}`,
          timestamp: new Date().toISOString(),
        })
      }

      // Generate personalized digest with preferences updated flag
      const { introduction, articles: summarizedArticles } = await generatePersonalizedDigest(
        articles,
        user.preferences,
        false, // Not a welcome digest
        user.name, // Pass the user's name
        true, // Is a preferences updated digest
      )
      console.log(`Generated digest with introduction: ${introduction.substring(0, 50)}...`)

      // Save digest to database
      const digest = await saveDigest({
        userId: user.id,
        createdAt: new Date(),
        articles: summarizedArticles,
        summary: introduction,
      })
      console.log(`Saved digest with ID: ${digest.id}`)

      // Send email with preferences updated flag
      await sendDigestEmail(user, digest, false, true) // isPreferencesUpdated flag
      console.log(`Sent preferences updated digest email to ${user.email}`)

      return NextResponse.json({
        success: true,
        message: `Preferences updated digest generated and sent to ${user.email}`,
        articleCount: summarizedArticles.length,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes("User not found")) {
        return NextResponse.json(
          {
            error: `User not found`,
            timestamp: new Date().toISOString(),
          },
          { status: 404 },
        )
      }
      throw error
    }
  } catch (error) {
    console.error("Error triggering preferences updated digest:", error)

    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to trigger preferences updated digest",
        message: error instanceof Error ? error.message : "Unknown error",
        details: JSON.stringify(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
