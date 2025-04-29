// lib/email-service.ts

import { sendEmail, createConfirmationEmailHtml } from "./email-service-utils"

// Send confirmation email
async function sendConfirmationEmail(user: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    const fullBaseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`
    const confirmationLink = `${fullBaseUrl}/api/confirm?email=${encodeURIComponent(user.email)}`

    const emailPreferences = {
      updates: true,
      offers: false,
      newsletter: false,
    }

    const html = createConfirmationEmailHtml(user.name, user.email, emailPreferences, confirmationLink)

    await sendEmail(user.email, "Confirm Your Subscription - News Digest", html)
    console.log(`Confirmation email sent to ${user.email}`)
    return { success: true }
  } catch (error) {
    console.error("Error sending confirmation email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Send digest email
async function sendDigestEmail(user: any, digest: any, isWelcomeDigest = false, isPreferencesUpdated = false) {
  // In development mode, just log the email
  if (process.env.NODE_ENV !== "production") {
    console.log(`Would send digest to ${user.email}`)
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
        <title>Your Daily News Digest</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c3e50; }
          .article { margin-bottom: 20px; }
          .article h2 { color: #3498db; }
          .footer { margin-top: 30px; font-size: 0.9em; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <h1>Your Daily News Digest</h1>
        <p>${digest.summary}</p>
        ${digest.articles
          .map(
            (article: any) => `
          <div class="article">
            <h2><a href="${article.url}">${article.title}</a></h2>
            <p>${article.summary}</p>
          </div>
        `,
          )
          .join("")}
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
        to: user.email,
        subject: isWelcomeDigest
          ? "Welcome to Your Personalized News Digest!"
          : isPreferencesUpdated
            ? "Your Updated News Digest Preferences"
            : "Your Daily News Digest",
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to send digest email:", error)
    return { success: false }
  }
}

export { sendDigestEmail, sendConfirmationEmail }
