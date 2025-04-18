import { Resend } from "resend"
import type { NewsDigest, User } from "./db-schema"

const resend = new Resend(process.env.RESEND_API_KEY!)

// Email template for news digest
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

// Send digest email to user
export async function sendDigestEmail(user: User, digest: NewsDigest) {
  const { data, error } = await resend.emails.send({
    from: "News Digest <digest@yourdomain.com>",
    to: [user.email],
    subject: `Your ${user.preferences.frequency.charAt(0).toUpperCase() + user.preferences.frequency.slice(1)} News Digest`,
    html: createDigestEmailHtml(user, digest),
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}
