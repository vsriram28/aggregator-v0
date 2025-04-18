import { NextResponse } from "next/server"

// This route is just for debugging environment variables
export async function GET() {
  return NextResponse.json({
    resendConfigured: !!process.env.RESEND_API_KEY,
    senderEmail: process.env.SENDER_EMAIL || "Not configured",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "Not configured",
  })
}
