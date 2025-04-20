import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, updateUserPreferences } from "@/lib/db"
import type { UserPreferences } from "@/lib/db-schema"

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log(`Fetching preferences for email: ${email}`)

    try {
      const user = await getUserByEmail(email)

      console.log(`Found user: ${user.id} with email: ${user.email}`)
      console.log("User preferences:", user.preferences)

      return NextResponse.json({
        preferences: user.preferences,
        userId: user.id,
        email: user.email,
      })
    } catch (userError) {
      console.error(`Error fetching user by email: ${email}`, userError)

      if (userError instanceof Error && userError.message.includes("User not found")) {
        return NextResponse.json({ error: `User with email ${email} not found` }, { status: 404 })
      }

      throw userError
    }
  } catch (error) {
    console.error("Get preferences error:", error)
    return NextResponse.json(
      {
        error: "Failed to get preferences",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, preferences, sendDigest = true } = body

    if (!userId || !preferences) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`Updating preferences for user ID: ${userId}`)
    console.log("New preferences:", preferences)
    console.log("Send digest:", sendDigest)

    const user = await updateUserPreferences(userId, preferences as Partial<UserPreferences>)

    // Trigger a preferences updated digest if requested
    if (sendDigest) {
      try {
        console.log(`Triggering preferences updated digest for user: ${user.email}`)

        // Get the base URL with protocol
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
        const fullBaseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`

        // Direct server-side call to the digest endpoint
        const digestUrl = `${fullBaseUrl}/api/digest/preferences-updated`
        console.log("Calling digest endpoint:", digestUrl)

        const response = await fetch(digestUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Failed to trigger preferences updated digest: ${response.status}`, errorText)
        } else {
          const result = await response.json()
          console.log(`Preferences updated digest successfully triggered:`, result)
        }
      } catch (error) {
        console.error(`Error triggering preferences updated digest for user ${user.email}:`, error)
        // Continue even if digest fails - don't fail the whole request
      }
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Update preferences error:", error)
    return NextResponse.json(
      {
        error: "Failed to update preferences",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
