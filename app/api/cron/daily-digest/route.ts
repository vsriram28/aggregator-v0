import { NextResponse } from "next/server"
import { getUsersByFrequency } from "@/lib/user-service"
import { fetchNewsForTopics } from "@/lib/news-fetcher"
import { generatePersonalizedDigest } from "@/lib/llm-service"
import { sendDigestEmail } from "@/lib/email-service"
import { saveDigest } from "@/lib/db"

export async function GET() {
  try {
    // Get all users with daily frequency preference
    const users = await getUsersByFrequency("daily")
    console.log(`Processing daily digests for ${users.length} users`)

    if (users.length === 0) {
      return NextResponse.json({
        message: "No users found with daily frequency preference",
        timestamp: new Date().toISOString(),
      })
    }

    let successCount = 0
    let errorCount = 0
    const errors: any[] = []

    for (const user of users) {
      try {
        // Fetch news based on user preferences, including preferred sources
        const articles = await fetchNewsForTopics(
          user.preferences.topics,
          5, // articles per topic
          user.preferences.sources, // Pass the user's preferred sources
        )

        if (articles.length === 0) {
          console.log(`No articles found for user ${user.id} with topics: ${user.preferences.topics.join(", ")}`)
          continue
        }

        // Generate personalized digest
        const { introduction, articles: summarizedArticles } = await generatePersonalizedDigest(
          articles,
          user.preferences,
          false,
          user.name, // Pass the user's name
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
        successCount++

        console.log(`Successfully sent daily digest to ${user.email}`)
      } catch (error) {
        console.error(`Error processing digest for user ${user.id}:`, error)
        errorCount++
        errors.push({
          userId: user.id,
          email: user.email,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: users.length,
      successful: successCount,
      failed: errorCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error processing daily digests:", error)
    return NextResponse.json(
      {
        error: "Failed to process daily digests",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
