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
      console.log(`Found user: ${user.id} (${user.email})`)

      // Fetch news based on user preferences
      const articles = await fetchNewsForTopics(user.preferences.topics)
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
      )
      console.log(`Generated digest with introduction: ${introduction.substring(0, 50)}...`)

      // Save digest to database - use the correct column names
      const digest = await saveDigest({
        userId: user.id, // This will be mapped to user_id in the saveDigest function
        createdAt: new Date(), // This will be mapped to created_at in the saveDigest function
        articles: summarizedArticles,
        summary: introduction,
      })
      console.log(`Saved digest with ID: ${digest.id}`)

      // Send email
      await sendDigestEmail(user, digest)
      console.log(`Sent email to ${user.email}`)

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
        details: JSON.stringify(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
