import { NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/db"
import { fetchNewsForTopics } from "@/lib/news-fetcher"
import { generatePersonalizedDigest } from "@/lib/llm-service"
import { sendDigestEmail } from "@/lib/email-service"
import { saveDigest } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    console.log(`Welcome digest requested for email: ${email}`)

    // Add a delay to ensure the user is fully created in the database
    await new Promise((resolve) => setTimeout(resolve, 5000)) // 5-second delay

    // Get user by email
    try {
      const user = await getUserByEmail(email)
      console.log(`Found user: ${user.id} (${user.email})`)

      // Fetch news based on user preferences, including preferred sources
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

      // Generate personalized digest
      const { introduction, articles: summarizedArticles } = await generatePersonalizedDigest(
        articles,
        user.preferences,
        true, // isWelcomeDigest flag
        user.name, // Pass the user's name
      )
      console.log(`Generated welcome digest with introduction: ${introduction.substring(0, 50)}...`)

      // Save digest to database
      const digest = await saveDigest({
        userId: user.id,
        createdAt: new Date(),
        articles: summarizedArticles,
        summary: introduction,
      })
      console.log(`Saved welcome digest with ID: ${digest.id}`)

      // Send email
      await sendDigestEmail(user, digest, true) // isWelcomeDigest flag
      console.log(`Sent welcome digest email to ${user.email}`)

      return NextResponse.json({
        success: true,
        message: `Welcome digest generated and sent to ${email}`,
        articleCount: summarizedArticles.length,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes("User not found")) {
        return NextResponse.json(
          {
            error: `User with email ${email} not found`,
            timestamp: new Date().toISOString(),
          },
          { status: 404 },
        )
      }
      throw error
    }
  } catch (error) {
    console.error("Error triggering welcome digest:", error)

    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to trigger welcome digest",
        message: error instanceof Error ? error.message : "Unknown error",
        details: JSON.stringify(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
