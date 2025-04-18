import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import type { NewsArticle, UserPreferences } from "./db-schema"

// Add better error handling to the summarizeArticle function
export async function summarizeArticle(article: NewsArticle) {
  const prompt = `
    Summarize the following news article in a concise paragraph:
    
    Title: ${article.title}
    Source: ${article.source}
    Content: ${article.content}
    
    Summary:
  `

  try {
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt,
    })

    return text.trim()
  } catch (error) {
    console.error(`Error summarizing article "${article.title}":`, error)
    // Return a fallback summary instead of failing completely
    return `${article.title} - Unable to generate summary due to API error.`
  }
}

// Also improve error handling in generatePersonalizedDigest
export async function generatePersonalizedDigest(articles: NewsArticle[], preferences: UserPreferences) {
  try {
    // First, summarize each article if not already summarized
    const summarizedArticles = await Promise.all(
      articles.map(async (article) => {
        if (!article.summary) {
          try {
            article.summary = await summarizeArticle(article)
          } catch (error) {
            console.error(`Error summarizing article in digest:`, error)
            article.summary = `${article.title} - Summary unavailable.`
          }
        }
        return article
      }),
    )

    // Then, generate a personalized introduction
    const format = preferences.format === "short" ? "concise" : "detailed"
    const topicsString = preferences.topics.join(", ")

    const prompt = `
      Create a personalized news digest introduction for a reader interested in ${topicsString}.
      The digest will contain ${summarizedArticles.length} articles in a ${format} format.
      Make it engaging and personal, highlighting why these news items are relevant to their interests.
      Keep it under 150 words.
    `

    try {
      const { text: introduction } = await generateText({
        model: google("gemini-1.5-flash"),
        prompt,
      })

      return {
        introduction: introduction.trim(),
        articles: summarizedArticles,
      }
    } catch (error) {
      console.error("Error generating introduction:", error)
      // Provide a fallback introduction
      return {
        introduction: `Here's your ${format} news digest on ${topicsString}. We've gathered ${summarizedArticles.length} articles that match your interests.`,
        articles: summarizedArticles,
      }
    }
  } catch (error) {
    console.error("Error in generatePersonalizedDigest:", error)
    throw error
  }
}
