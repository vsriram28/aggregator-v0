import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Handle HEAD requests (used for preflight checks)
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}

// Handle POST requests for actual email sending
export async function POST(request: NextRequest) {
  // Only allow this in production server environment
  if (process.env.NODE_ENV !== "production") {
    console.log("Email sending skipped in development/preview mode")
    return NextResponse.json({ success: true, message: "Email sending skipped in development mode" })
  }

  try {
    const { to, subject, html } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create a transporter using email credentials from environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Get the sender email and name from environment variables
    const SENDER_EMAIL = process.env.EMAIL_USER || "news@yourdomain.com"
    const SENDER_NAME = process.env.SENDER_NAME || "News Digest"

    // Send the email
    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to,
      subject,
      html,
    })

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json(
      {
        error: "Failed to send email",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Also handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    status: "Email service is running",
    timestamp: new Date().toISOString(),
  })
}
