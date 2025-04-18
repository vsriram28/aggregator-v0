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

// Send unsubscribe confirmation email
async function sendUnsubscribeConfirmation(email: string, name: string) {
  // In development mode, just log the email
  if (process.env.NODE_ENV !== "production") {
    console.log(`Would send unsubscribe confirmation to ${email}`)
    return { success: true }
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    const fullBaseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`

    // Create email HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Unsubscribe Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c3e50; }
          .content { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .footer { margin-top: 30px; font-size: 0.9em; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <h1>Unsubscribe Confirmation</h1>
        <p>Hello ${name},</p>
        
        <div class="content">
          <p>You have been successfully unsubscribed from our news digest service.</p>
          <p>We're sorry to see you go! If you have any feedback on how we could improve our service, please let us know.</p>
        </div>
        
        <p>If you change your mind, you can always subscribe again by visiting our website.</p>
        
        <a href="${fullBaseUrl}" class="button">Visit Website</a>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `

    // Get the base URL with protocol
    const apiUrl = `${fullBaseUrl}/api/send-email`

    // Use the email sending API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: email,
        subject: "Unsubscribe Confirmation - News Digest",
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to send unsubscribe confirmation:", error)
    return { success: false }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if token is provided and valid (only if token is provided)
    if (token && !verifyUnsubscribeToken(email, token)) {
      return NextResponse.json({ error: "Invalid unsubscribe token" }, { status: 403 })
    }

    // Check if the user exists
    const { data: user, error: findError } = await supabase.from("users").select("id, name").eq("email", email).single()

    if (findError) {
      if (findError.code === "PGRST116") {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      throw findError
    }

    // Send unsubscribe confirmation email
    await sendUnsubscribeConfirmation(email, user.name || "User")

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
