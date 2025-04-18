import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/db"
import { sendConfirmationEmail } from "@/lib/email-service" // Add this import
import type { UserPreferences } from "@/lib/db-schema"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, preferences } = body

    if (!email || !name || !preferences) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const user = await createUser(email, name, preferences as UserPreferences)

    // Send confirmation email immediately after successful registration
    await sendConfirmationEmail(user)

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Subscription error:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
