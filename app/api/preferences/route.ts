import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, updateUserPreferences } from "@/lib/db"
import type { UserPreferences } from "@/lib/db-schema"

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await getUserByEmail(email)

    return NextResponse.json({ preferences: user.preferences })
  } catch (error) {
    console.error("Get preferences error:", error)
    return NextResponse.json({ error: "Failed to get preferences" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, preferences } = body

    if (!userId || !preferences) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const user = await updateUserPreferences(userId, preferences as Partial<UserPreferences>)

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Update preferences error:", error)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}
