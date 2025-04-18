import { type NextRequest, NextResponse } from "next/server"
import { createUser, getUserByEmail, updateUserPreferences } from "@/lib/db"
import { sendConfirmationEmail } from "@/lib/email-service"
import type { UserPreferences } from "@/lib/db-schema"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, preferences } = body

    if (!email || !name || !preferences) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    try {
      const existingUser = await getUserByEmail(email)

      // If we get here, user exists - update their preferences
      const updatedUser = await updateUserPreferences(existingUser.id, preferences as UserPreferences)

      // Send confirmation email
      await sendConfirmationEmail(updatedUser)

      return NextResponse.json({
        user: updatedUser,
        message: "Your subscription has been updated successfully!",
      })
    } catch (error) {
      // User doesn't exist, continue with creation
      const newUser = await createUser(email, name, preferences as UserPreferences)

      // Send confirmation email
      await sendConfirmationEmail(newUser)

      return NextResponse.json({
        user: newUser,
        message: "Your subscription has been created successfully!",
      })
    }
  } catch (error) {
    console.error("Subscription error:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
