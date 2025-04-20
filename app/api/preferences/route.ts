import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, updateUserPreferences } from "@/lib/db"
import { supabase } from "@/lib/db"
import type { UserPreferences } from "@/lib/db-schema"

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email")

    if (!email) {
      console.log("API: No email provided")
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log(`API: Fetching preferences for email: ${email}`)

    try {
      // Direct Supabase query for debugging
      console.log(`API: Querying Supabase directly for email: ${email}`)
      const { data: directData, error: directError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single()

      if (directError) {
        console.error(`API: Direct Supabase query error for ${email}:`, directError)
      } else if (directData) {
        console.log(`API: Direct Supabase query found user: ${directData.id}`)
        console.log(`API: User preferences from direct query:`, directData.preferences)
      }

      // Use the getUserByEmail function
      const user = await getUserByEmail(email)

      console.log(`API: Found user: ${user.id} with email: ${user.email}`)
      console.log("API: User preferences:", user.preferences)

      return NextResponse.json({
        preferences: user.preferences,
        userId: user.id,
        email: user.email,
      })
    } catch (userError) {
      console.error(`API: Error fetching user by email: ${email}`, userError)

      if (userError instanceof Error && userError.message.includes("User not found")) {
        return NextResponse.json({ error: `User with email ${email} not found` }, { status: 404 })
      }

      throw userError
    }
  } catch (error) {
    console.error("API: Get preferences error:", error)
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

    console.log(`API: Updating preferences for user ID: ${userId}`)
    console.log("API: New preferences:", preferences)

    const user = await updateUserPreferences(userId, preferences as Partial<UserPreferences>)

    // Trigger a preferences updated digest if requested
    if (sendDigest) {
      try {
        console.log(`API: Triggering preferences updated digest for user: ${user.email}`)

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
        const fullBaseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`

        // Call the preferences-updated digest endpoint
        const response = await fetch(`${fullBaseUrl}/api/digest/preferences-updated`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`API: Failed to trigger preferences updated digest: ${response.status}`, errorText)
        } else {
          console.log(`API: Preferences updated digest successfully triggered for user: ${user.email}`)
        }
      } catch (error) {
        console.error(`API: Error triggering preferences updated digest for user ${user.email}:`, error)
        // Continue even if digest fails - don't fail the whole request
      }
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("API: Update preferences error:", error)
    return NextResponse.json(
      {
        error: "Failed to update preferences",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
