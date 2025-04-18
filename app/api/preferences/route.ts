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
    const { userId, preferences } = body

    if (!userId || !preferences) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`Updating preferences for user ID: ${userId}`)

    const user = await updateUserPreferences(userId, preferences as Partial<UserPreferences>)

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
