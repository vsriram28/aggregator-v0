import { NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/db"
import { fetchNewsForTopics } from "@/lib/news-fetcher"
import { generatePersonalizedDigest } from "@/lib/llm-service"
import { supabase } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")
    const component = searchParams.get("component") || "all"

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
    }

    // Test database connection
    if (component === "all" || component === "db") {
      try {
        // Test Supabase connection
        const { data: healthCheck, error: healthError } = await supabase.from("users").select("count(*)")

        if (healthError) {
          results.db = { error: healthError.message }
        } else {
          // Get user by email
          try {
            const user = await getUserByEmail(email)
            results.db = {
              success: true,
              user: {
                id: user.id,
                email: user.email,
                preferences: user.preferences,
              },
            }
          } catch (userError) {
            results.db = { error: userError instanceof Error ? userError.message : "Unknown user error" }
          }
        }
      } catch (dbError) {
        results.db = { error: dbError instanceof Error ? dbError.message : "Unknown database error" }
      }
    }

    // Test news API
    if ((component === "all" || component === "news") && results.db?.success) {
      try {
        const user = await getUserByEmail(email)
        const topics = user.preferences.topics

        // Only fetch one article per topic for testing
        const articles = await fetchNewsForTopics(topics, 1)

        results.news = {
          success: true,
          topicsQueried: topics,
          articlesFound: articles.length,
          sampleArticle:
            articles.length > 0
              ? {
                  title: articles[0].title,
                  source: articles[0].source,
                  url: articles[0].url,
                }
              : null,
        }
      } catch (newsError) {
        results.news = { error: newsError instanceof Error ? newsError.message : "Unknown news API error" }
      }
    }

    // Test LLM service
    if ((component === "all" || component === "llm") && results.news?.success) {
      try {
        const user = await getUserByEmail(email)
        const articles = await fetchNewsForTopics(user.preferences.topics, 1)

        if (articles.length > 0) {
          const digest = await generatePersonalizedDigest(articles, user.preferences)

          results.llm = {
            success: true,
            introductionLength: digest.introduction.length,
            sampleIntroduction: digest.introduction.substring(0, 100) + "...",
          }
        } else {
          results.llm = { warning: "No articles found to test LLM" }
        }
      } catch (llmError) {
        results.llm = { error: llmError instanceof Error ? llmError.message : "Unknown LLM error" }
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json(
      {
        error: "Debug endpoint failed",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
