import { NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/db"
import { fetchNewsForTopics } from "@/lib/news-fetcher"
import { generatePersonalizedDigest } from "@/lib/llm-service"
import { sendDigestEmail } from "@/lib/email-service"
import { saveDigest } from "@/lib/db"
import { supabase } from "@/lib/db"

export async function GET(request: Request) {
  const logs: string[] = []
  const addLog = (message: string) => {
    console.log(message)
    logs.push(message)
  }

  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")
    const userId = searchParams.get("userId")
    const isPreferencesUpdated = searchParams.get("isPreferencesUpdated") === "true"

    addLog(
      `Debug trigger-digest called with params: email=${email}, userId=${userId}, isPreferencesUpdated=${isPreferencesUpdated}`,
    )

    if (!email && !userId) {
      return NextResponse.json({ error: "Email or userId parameter is required", logs }, { status: 400 })
    }

    // Get user by email or ID
    try {
      let user
      if (email) {
        addLog(`Looking up user by email: ${email}`)
        user = await getUserByEmail(email)
      } else if (userId) {
        addLog(`Looking up user by ID: ${userId}`)
        const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()
        if (error) {
          addLog(`Error fetching user by ID: ${error.message}`)
          throw error
        }
        user = data
      }

      addLog(`Found user: ${user.id} (${user.email})`)
      addLog(`User preferences: ${JSON.stringify(user.preferences)}`)

      // Fetch news based on user preferences
      addLog(`Fetching news for topics: ${user.preferences.topics.join(", ")}`)
      const articles = await fetchNewsForTopics(
        user.preferences.topics,
        5, // articles per topic
        user.preferences.sources, // Pass the user's preferred sources
      )

      addLog(`Fetched ${articles.length} articles`)

      if (articles.length === 0) {
        addLog("No articles found matching the user's topics")
        return NextResponse.json({
          warning: `No articles found for topics: ${user.preferences.topics.join(", ")}`,
          logs,
          timestamp: new Date().toISOString(),
        })
      }

      // Generate personalized digest with preferences updated flag
      addLog("Generating personalized digest")
      const { introduction, articles: summarizedArticles } = await generatePersonalizedDigest(
        articles,
        user.preferences,
        false, // Not a welcome digest
        user.name, // Pass the user's name
        isPreferencesUpdated, // Is a preferences updated digest
      )
      addLog(`Generated digest with introduction: ${introduction.substring(0, 100)}...`)

      // Save digest to database
      addLog("Saving digest to database")
      const digest = await saveDigest({
        userId: user.id,
        createdAt: new Date(),
        articles: summarizedArticles,
        summary: introduction,
      })
      addLog(`Saved digest with ID: ${digest.id}`)

      // Send email with preferences updated flag
      addLog("Sending email")
      await sendDigestEmail(user, digest, false, isPreferencesUpdated)
      addLog(`Sent digest email to ${user.email}\`)  digest, false, isPreferencesUpdated)
      addLog(\`Sent digest email to ${user.email}`)

      return NextResponse.json({
        success: true,
        message: `Digest generated and sent to ${user.email}`,
        articleCount: summarizedArticles.length,
        logs,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      if (error instanceof Error && error.message.includes("User not found")) {
        return NextResponse.json(
          {
            error: `User not found`,
            logs,
            timestamp: new Date().toISOString(),
          },
          { status: 404 },
        )
      }
      throw error
    }
  } catch (error) {
    console.error("Error triggering digest:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to trigger digest",
        message: errorMessage,
        logs,
        details: JSON.stringify(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
