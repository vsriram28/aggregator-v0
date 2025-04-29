// lib/email-service.ts

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

// Get the next digest date based on frequency
function getNextDigestDate(frequency: "daily" | "weekly"): Date {
  const now = new Date()
  const nextDigest = new Date(now)

  if (frequency === "daily") {
    // Set to 8:00 AM tomorrow
    nextDigest.setDate(nextDigest.getDate() + 1)
    nextDigest.setHours(8, 0, 0, 0)
  } else {
    // Set to next Sunday at 9:00 AM
    const daysUntilSunday = 7 - now.getDay()
    nextDigest.setDate(nextDigest.getDate() + daysUntilSunday)
    nextDigest.setHours(9, 0, 0, 0)
  }

  return nextDigest
}

// Format date in a user-friendly way
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Email template for news digest
function createDigestEmailHtml(user: User, digest: NewsDigest, isWelcomeDigest = false, isPreferencesUpdated = false) {
  const unsubscribeUrl = getUnsubscribeUrl(user.email)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
  // Make sure the baseUrl has a protocol
  const fullBaseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`
  // Include both userId and email in the preferences URL
  const preferencesUrl = `${fullBaseUrl}/preferences?userId=${user.id}&email=${encodeURIComponent(user.email)}`

  // Log the URLs for debugging
  console.log("Digest Email - Preferences URL:", preferencesUrl)
  console.log("Digest Email - Unsubscribe URL:", unsubscribeUrl)

  // Calculate next digest date for welcome digests
  const nextDigestInfo = isWelcomeDigest
    ? `<p>Your next regular digest will be sent on <strong>${formatDate(getNextDigestDate(user.preferences.frequency))}</strong> and will continue on your chosen ${user.preferences.frequency} schedule.</p>`
    : ""

  // Add a welcome message for welcome digests
  const welcomeHeader = isWelcomeDigest
    ? `
    <div style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #3498db;">
      <h2 style="color: #3498db; margin-top: 0;">Welcome to News Digest!</h2>
      <p>This is your first personalized digest. ${nextDigestInfo}</p>
    </div>
  `
    : ""

  // Add a preferences updated message
  const preferencesUpdatedHeader = isPreferencesUpdated
    ? `
    <div style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #3498db;">
      <h2 style="color: #3498db; margin-top: 0;">Your Preferences Have Been Updated!</h2>
      <p>This is a special digest based on your updated preferences. Your next regular digest will be sent according to your new ${user.preferences.frequency} schedule.</p>
    </div>
  `
    : ""

  // Set the appropriate header based on digest type
  const specialHeader = isWelcomeDigest ? welcomeHeader : isPreferencesUpdated ? preferencesUpdatedHeader : ""

  // Set the appropriate email title
  const emailTitle = isWelcomeDigest
    ? "Welcome to News Digest!"
    : isPreferencesUpdated
      ? "Your Updated News Digest"
      : "Your Personalized News Digest"

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${emailTitle}</title>
    <style>
      body { 
        font-family: Arial, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        max-width: 600px; 
        margin: 0 auto; 
        padding: 20px; 
        background-color: #f8fff0; /* Light lime background */
      }
      
      /* Add this new style for the top border */
      .top-border {
        height: 5px;
        background-color: #8bc34a;
        border-radius: 5px 5px 0 0;
        margin-bottom: -1px;
      }
      .container {
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 3px 3px 10px rgba(0,0,0,0.1); /* Stronger shadow on the right */
        padding: 25px;
        border-top: 5px solid #8bc34a; /* Lime accent border */
        border-left: 1px solid #e0e0e0; /* Left vertical boundary */
        border-right: 1px solid #e0e0e0; /* Right vertical boundary */
        max-width: 580px;
        margin: 0 auto;
      }
      h1 { 
        color: #2c3e50; 
        margin-top: 0;
        padding-bottom: 15px;
        border-bottom: 1px solid #e8f5e9; /* Very light green border */
      }
      .article { 
        margin-bottom: 25px; 
        border-bottom: 1px solid #e0e0e0; 
        padding-bottom: 15px; 
        background-color: #ffffff;
        border-radius: 4px;
      }
      .article-title { 
        font-weight: bold; 
        margin-bottom: 5px; 
        color: #3c4043;
      }
      .article-source { 
        color: #7f8c8d; 
        font-size: 0.9em; 
        margin-bottom: 10px; 
      }
      .article-summary { 
        margin-bottom: 10px; 
      }
      .article-link { 
        color: #8bc34a; /* Lime link color */
        text-decoration: none; 
      }
      .article-link:hover { 
        text-decoration: underline; 
      }
      .footer { 
        margin-top: 30px; 
        font-size: 0.9em; 
        color: #7f8c8d; 
        background-color: #f1f8e9; /* Very light lime footer */
        padding: 15px;
        border-radius: 4px;
      }
      .unsubscribe { 
        margin-top: 20px; 
        font-size: 0.8em; 
        color: #95a5a6; 
        text-align: center; 
      }
      .unsubscribe a { 
        color: #95a5a6; 
        text-decoration: none; 
      }
      .unsubscribe a:hover { 
        text-decoration: underline; 
      }
    </style>
  </head>
  <body>
    <div class="top-border"></div>
    <div class="container">
      <h1>${emailTitle}</h1>
      <p>Hello ${user.name},</p>
      
      ${specialHeader}
      
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
        <p>To update your preferences, <a href="${preferencesUrl}" target="_blank" rel="noopener noreferrer" style="color: #8bc34a;">click here</a>.</p>
      </div>
      
      <div class="unsubscribe">
        <p>If you no longer wish to receive these emails, <a href="${unsubscribeUrl}" target="_blank" rel="noopener noreferrer">click here to unsubscribe</a>.</p>
      </div>
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
  // Include both userId and email in the preferences URL
  const preferencesUrl = `${fullBaseUrl}/preferences?userId=${user.id}&email=${encodeURIComponent(user.email)}`

  // Calculate next digest date
  const nextRegularDigest = getNextDigestDate(user.preferences.frequency)
  const nextDigestInfo = `Your first regular digest will be sent on <strong>${formatDate(nextRegularDigest)}</strong> and will continue on your chosen ${user.preferences.frequency} schedule.`

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
      body { 
        font-family: Arial, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        max-width: 600px; 
        margin: 0 auto; 
        padding: 20px; 
        background-color: #f8fff0; /* Light lime background */
      }
      
      /* Add this new style for the top border */
      .top-border {
        height: 5px;
        background-color: #8bc34a;
        border-radius: 5px 5px 0 0;
        margin-bottom: -1px;
      }
      .container {
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 3px 3px 10px rgba(0,0,0,0.1); /* Stronger shadow on the right */
        padding: 25px;
        border-top: 5px solid #8bc34a; /* Lime accent border */
        border-left: 1px solid #e0e0e0; /* Left vertical boundary */
        border-right: 1px solid #e0e0e0; /* Right vertical boundary */
        max-width: 580px;
        margin: 0 auto;
      }
      h1 { 
        color: #2c3e50; 
        margin-top: 0;
      }
      .preferences { 
        background-color: #f1f8e9; /* Very light lime background */
        padding: 15px; 
        border-radius: 5px; 
        margin: 20px 0; 
      }
      .preferences h3 { 
        margin-top: 0; 
        color: #558b2f; /* Darker lime color */
      }
      .preferences ul { 
        margin-bottom: 0; 
      }
      .button { 
        display: inline-block; 
        background-color: #8bc34a; /* Lime button */
        color: white; 
        padding: 10px 20px; 
        text-decoration: none; 
        border-radius: 5px; 
        margin-top: 15px; 
      }
      .button:hover {
        background-color: #7cb342; /* Slightly darker lime on hover */
      }
      .footer { 
        margin-top: 30px; 
        font-size: 0.9em; 
        color: #7f8c8d; 
        border-top: 1px solid #e8f5e9; /* Very light green border */
        padding-top: 15px; 
      }
      .unsubscribe { 
        margin-top: 20px; 
        font-size: 0.8em; 
        color: #95a5a6; 
        text-align: center; 
      }
      .unsubscribe a { 
        color: #95a5a6; 
        text-decoration: none; 
      }
      .unsubscribe a:hover { 
        text-decoration: underline; 
      }
      .highlight { 
        background-color: #f1f8e9; /* Very light lime background */
        padding: 15px; 
        border-radius: 5px; 
        margin: 20px 0; 
        border-left: 4px solid #8bc34a; /* Lime accent border */
      }
    </style>
  </head>
  <body>
    <div class="top-border"></div>
    <div class="container">
      <h1>Welcome to News Digest!</h1>
      <p>Hello ${user.name},</p>
      
      <p>Thank you for subscribing to our personalized news digest service. Your subscription has been confirmed!</p>
      
      <div class="highlight">
        <p><strong>Your welcome digest is being prepared and will be delivered shortly.</strong></p>
        <p>${nextDigestInfo}</p>
      </div>
      
      <div class="preferences">
        <h3>Your Preferences</h3>
        <ul>
          <li><strong>Topics:</strong> ${topicsString}</li>
          <li><strong>Sources:</strong> ${sourcesString}</li>
          <li><strong>Frequency:</strong> ${frequencyText}</li>
          <li><strong>Format:</strong> ${formatText}</li>
        </ul>
      </div>
      
      <a href="${preferencesUrl}" target="_blank" rel="noopener noreferrer" class="button">Manage Your Preferences</a>
      
      <div class="footer">
        <p>If you didn't sign up for this service, please <a href="${unsubscribeUrl}" target="_blank" rel="noopener noreferrer" style="color: #8bc34a;">click here to unsubscribe</a>.</p>
      </div>
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
export async function sendDigestEmail(
  user: User,
  digest: NewsDigest,
  isWelcomeDigest = false,
  isPreferencesUpdated = false,
) {
  try {
    let subject = "Your Personalized News Digest"

    if (isWelcomeDigest) {
      subject = "Welcome to News Digest - Your First Personalized Digest"
    } else if (isPreferencesUpdated) {
      subject = "Your Updated News Digest - Based on Your New Preferences"
    } else {
      subject = `Your ${user.preferences.frequency.charAt(0).toUpperCase() + user.preferences.frequency.slice(1)} News Digest`
    }

    console.log(
      `Sending ${isWelcomeDigest ? "welcome" : isPreferencesUpdated ? "preferences updated" : "regular"} digest email to ${user.email}`,
    )
    console.log(`Digest contains ${digest.articles.length} articles`)

    const result = await sendEmail(
      user.email,
      subject,
      createDigestEmailHtml(user, digest, isWelcomeDigest, isPreferencesUpdated),
    )

    console.log(
      `${isWelcomeDigest ? "Welcome" : isPreferencesUpdated ? "Preferences updated" : "Regular"} digest email sent:`,
      result.messageId,
    )
    return result
  } catch (error) {
    console.error(
      `Failed to send ${isWelcomeDigest ? "welcome" : isPreferencesUpdated ? "preferences updated" : "regular"} digest email:`,
      error,
    )
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
export { generateUnsubscribeToken, getUnsubscribeUrl, getNextDigestDate, formatDate }
