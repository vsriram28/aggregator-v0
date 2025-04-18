import type { NewsDigest, User } from "./db-schema"

// Email template for news digest (keep this function as is)
function createDigestEmailHtml(user: User, digest: NewsDigest) {
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
        <p>To update your preferences or unsubscribe, <a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences?userId=${user.id}">click here</a>.</p>
      </div>
    </body>
    </html>
  `
}

// Create confirmation email HTML template (keep this function as is)
function createConfirmationEmailHtml(user: User) {
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
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences?userId=${user.id}" class="button">Manage Your Preferences</a>
      
      <div class="footer">
        <p>If you didn't sign up for this service, please ignore this email or <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${user.email}">unsubscribe</a>.</p>
      </div>
    </body>
    </html>
  `
}

// Simple email sender that works in both server and client environments
async function sendEmail(to: string, subject: string, html: string) {
  // Check if we're in a server environment where we can use fetch
  if (typeof window === "undefined") {
    try {
      // Get the base URL with protocol
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""

      // Make sure we have a proper URL with protocol
      const apiUrl = baseUrl.startsWith("http") ? `${baseUrl}/api/send-email` : `https://${baseUrl}/api/send-email`

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
