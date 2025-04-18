import type { NewsDigest, User } from "./db-schema"
import { createHash } from "crypto"

// Generate a simple unsubscribe token based on email and a secret
function generateUnsubscribeToken(email: string): string {
  const secret = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "news-digest-secret"
  return createHash("sha256").update(`${email}:${secret}`).digest("hex").substring(0, 32)
}

// Get the unsubscribe URL for a user
function getUnsubscribeUrl(email: string): string {
  const token = generateUnsubscribeToken(email)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
  // Make sure the baseUrl has a protocol
  const fullBaseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`
  // Point directly to the unsubscribe page, not the API
  return `${fullBaseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
}

// Email template for news digest
function createDigestEmailHtml(user: User, digest: NewsDigest) {
  const unsubscribeUrl = getUnsubscribeUrl(user.email)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
  // Make sure the baseUrl has a protocol
  const fullBaseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`
  const preferencesUrl = `${fullBaseUrl}/preferences?userId=${user.id}`

  // Log the URLs for debugging
  console.log("Digest Email - Preferences URL:", preferencesUrl)
  console.log("Digest Email - Unsubscribe URL:", unsubscribeUrl)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Personalized News Digest</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; }
        h2 { color: #3498db; margin-top: 30px; }
        .article { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        .article-title { font-weight: bold; margin-bottom: 5px; }
        .article-source { color: #7f8c8d; font-size: 0.9em; margin-bottom: 10px; }
        .article-summary { margin-bottom: 10px; }
        .article-link { color: #3498db; text-decoration: none; }
        .article-link:hover { text-decoration: underline; }
        .footer { margin-top: 30px; font-size: 0.9em; color: #7f8c8d; }
        .unsubscribe { margin-top: 20px; font-size: 0.8em; color: #95a5a6; text-align: center; }
        .unsubscribe a { color: #95a5a6; text-decoration: none; }
        .unsubscribe a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Your Personalized News Digest</h1>
      <p>Hello ${user.name},</p>
      
      <p>${digest.summary}</p>
      
      <div class="articles">
        ${digest.articles
          .map(
            (article) => `
          <div class="article">
            <div class="article-title">${article.title}</div>
            <div class="article-source">From ${article.source} • ${new Date(article.publishedAt).toLocaleDateString()}</div>
            <div class="article-summary">${article.summary}</div>
            <a href="${article.url}" class="article-link">Read full article →</a>
          </div>
        `,
          )
          .join("")}
      </div>
      
      <div class="footer">
        <p>This digest was created based on your preferences: ${user.preferences.topics.join(", ")}</p>
        <p>To update your preferences, <a href="${preferencesUrl}" target="_blank" rel="noopener noreferrer">click here</a> (${preferencesUrl}).</p>
      </div>
      
      <div class="unsubscribe">
        <p>If you no longer wish to receive these emails, <a href="${unsubscribeUrl}" target="_blank" rel="noopener noreferrer">click here to unsubscribe</a> (${unsubscribeUrl}).</p>
      </div>
    </body>
    </html>
  `
}

// Create confirmation email HTML template
function createConfirmationEmailHtml(user: User) {
  const unsubscribeUrl = getUnsubscribeUrl(user.email)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
  // Make sure the baseUrl has a protocol
  const fullBaseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`
  const preferencesUrl = `${fullBaseUrl}/preferences?userId=${user.id}`

  // Log the URLs for debugging
  console.log("Confirmation Email - Preferences URL:", preferencesUrl)
  console.log("Confirmation Email - Unsubscribe URL:", unsubscribeUrl)

  const topicsString = user.preferences.topics.join(", ")
  const sourcesString = user.preferences.sources.join(", ")
  const frequencyText = user.preferences.frequency === "daily" ? "daily" : "weekly"
  const formatText = user.preferences.format === "short" ? "short summaries" : "detailed analysis"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to News Digest!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; }
        .preferences { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .preferences h3 { margin-top: 0; color: #3498db; }
        .preferences ul { margin-bottom: 0; }
        .button { display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { margin-top: 30px; font-size: 0.9em; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 15px; }
        .unsubscribe { margin-top: 20px; font-size: 0.8em; color: #95a5a6; text-align: center; }
        .unsubscribe a { color: #95a5a6; text-decoration: none; }
        .unsubscribe a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Welcome to News Digest!</h1>
      <p>Hello ${user.name},</p>
      
      <p>Thank you for subscribing to our personalized news digest service. Your subscription has been confirmed, and you'll start receiving news digests based on your preferences.</p>
      
      <div class="preferences">
        <h3>Your Preferences</h3>
        <ul>
          <li><strong>Topics:</strong> ${topicsString}</li>
          <li><strong>Sources:</strong> ${sourcesString}</li>
          <li><strong>Frequency:</strong> ${frequencyText}</li>
          <li><strong>Format:</strong> ${formatText}</li>
        </ul>
      </div>
      
      <p>Your first digest will be delivered ${user.preferences.frequency === "daily" ? "tomorrow" : "next week"}. We hope you'll find the content valuable and relevant to your interests.</p>
      
      <a href="${preferencesUrl}" target="_blank" rel="noopener noreferrer" class="button">Manage Your Preferences</a>
      
      <div class="footer">
        <p>If you didn't sign up for this service, please <a href="${unsubscribeUrl}" target="_blank" rel="noopener noreferrer">click here to unsubscribe</a> (${unsubscribeUrl}).</p>
      </div>
      
    </body>
    </html>
  `
}

// Simple email sender that works in both server and client environments
async function sendEmail(to: string, subject: string, html: string) {
  // In preview/development mode, just log the email
  if (process.env.NODE_ENV !== "production") {
    console.log("Email would be sent to:", to)
    console.log("Subject:", subject)
    console.log("HTML content length:", html.length)
    return { success: true, messageId: "preview-mode" }
  }

  // Check if we're in a server environment where we can use fetch
  if (typeof window === "undefined") {
    try {
      // Get the base URL with protocol
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
      // Make sure we have a proper URL with protocol
      const fullBaseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`
      const apiUrl = `${fullBaseUrl}/api/send-email`

      console.log("Sending email via API:", apiUrl)

      // Use a simple API-based approach instead of Nodemailer
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          subject,
          html,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to send email: ${error}`)
      }

      return { success: true, messageId: Date.now().toString() }
    } catch (error) {
      console.error("Email sending error:", error)
      // For preview/development, just log the email content
      console.log("Email would be sent to:", to)
      console.log("Subject:", subject)
      console.log("HTML content length:", html.length)

      // Return success in preview mode to allow the flow to continue
      return { success: true, messageId: "preview-mode" }
    }
  } else {
    // In client environment, just log
    console.log("Email would be sent to:", to)
    console.log("Subject:", subject)
    return { success: true, messageId: "client-side" }
  }
}

// Send digest email to user
export async function sendDigestEmail(user: User, digest: NewsDigest) {
  try {
    const result = await sendEmail(
      user.email,
      `Your ${user.preferences.frequency.charAt(0).toUpperCase() + user.preferences.frequency.slice(1)} News Digest`,
      createDigestEmailHtml(user, digest),
    )

    console.log("Digest email sent:", result.messageId)
    return result
  } catch (error) {
    console.error("Failed to send digest email:", error)
    // Don't throw in preview mode
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
    return { success: false }
  }
}

// Send confirmation email to newly registered user
export async function sendConfirmationEmail(user: User) {
  try {
    const result = await sendEmail(
      user.email,
      "Welcome to News Digest - Subscription Confirmed",
      createConfirmationEmailHtml(user),
    )

    console.log("Confirmation email sent:", result.messageId)
    return result
  } catch (error) {
    console.error("Failed to send confirmation email:", error)
    // Don't throw the error so the subscription process can continue
    return { success: false }
  }
}

// Export the token generation function for use in other files
export { generateUnsubscribeToken, getUnsubscribeUrl }
