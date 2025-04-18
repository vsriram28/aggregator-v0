import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/db"
import { fetchNewsForTopics } from "@/lib/news-fetcher"
import { generatePersonalizedDigest } from "@/lib/llm-service"

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    const articles = await fetchNewsForTopics(user.preferences.topics)
    const digest = await generatePersonalizedDigest(articles, user.preferences)

    return NextResponse.json({ digest })
  } catch (error) {
    console.error("Digest preview error:", error)
    return NextResponse.json({ error: "Failed to generate digest preview" }, { status: 500 })
  }
}
