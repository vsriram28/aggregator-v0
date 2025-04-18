import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { createHash } from "crypto"

// Generate a simple unsubscribe token based on email and a secret
function generateUnsubscribeToken(email: string): string {
  const secret = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "news-digest-secret"
  return createHash("sha256").update(`${email}:${secret}`).digest("hex").substring(0, 32)
}

// Verify the unsubscribe token
function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expectedToken = generateUnsubscribeToken(email)
  return token === expectedToken
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if token is provided and valid
    if (token && !verifyUnsubscribeToken(email, token)) {
      return NextResponse.json({ error: "Invalid unsubscribe token" }, { status: 403 })
    }

    // Check if the user exists
    const { data: user, error: findError } = await supabase.from("users").select("id").eq("email", email).single()

    if (findError) {
      if (findError.code === "PGRST116") {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      throw findError
    }

    // Delete the user
    const { error: deleteError } = await supabase.from("users").delete().eq("id", user.id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: "You have been successfully unsubscribed from the news digest service.",
    })
  } catch (error) {
    console.error("Unsubscribe error:", error)
    return NextResponse.json({ error: "Failed to process unsubscribe request" }, { status: 500 })
  }
}

// Also handle GET requests for direct unsubscribe links
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")
  const token = searchParams.get("token")

  // Redirect to the unsubscribe page with the parameters
  return NextResponse.redirect(
    new URL(`/unsubscribe?email=${encodeURIComponent(email || "")}&token=${token || ""}`, request.url),
  )
}
