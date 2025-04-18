import { NextResponse } from "next/server"
import { sendConfirmationEmail } from "@/lib/email-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    // Create a test user object
    const testUser = {
      id: "test-user-id",
      email: email,
      name: "Test User",
      createdAt: new Date(),
      preferences: {
        topics: ["Technology", "Science"],
        sources: ["BBC", "CNN"],
        frequency: "daily" as const,
        format: "short" as const,
      },
    }

    // Send a test confirmation email
    const result = await sendConfirmationEmail(testUser)

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
      result,
    })
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json(
      {
        error: "Failed to send test email",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
