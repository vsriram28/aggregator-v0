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

    // Get user by email
    try {
      const user = await getUserByEmail(email)

      // Fetch news based on user preferences
      const articles = await fetchNewsForTopics(user.preferences.topics)

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
      )

      // Save digest to database
      const digest = await saveDigest({
        userId: user.id,
        createdAt: new Date(),
        articles: summarizedArticles,
        summary: introduction,
      })

      // Send email
      await sendDigestEmail(user, digest)

      return NextResponse.json({
        success: true,
        message: `Digest generated and sent to ${email}`,
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
    console.error("Error triggering digest:", error)

    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to trigger digest",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        details: JSON.stringify(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
