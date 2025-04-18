import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import type { NewsArticle, UserPreferences } from "./db-schema"

// Summarize a single article using Google Gemini Flash 2.0
export async function summarizeArticle(article: NewsArticle) {
  const prompt = `
    Summarize the following news article in a concise paragraph:
    
    Title: ${article.title}
    Source: ${article.source}
    Content: ${article.content}
    
    Summary:
  `

  const { text } = await generateText({
    model: google("gemini-1.5-flash"),
    prompt,
  })

  return text.trim()
}

// Generate a personalized digest for a user
export async function generatePersonalizedDigest(articles: NewsArticle[], preferences: UserPreferences) {
  // First, summarize each article if not already summarized
  const summarizedArticles = await Promise.all(
    articles.map(async (article) => {
      if (!article.summary) {
        article.summary = await summarizeArticle(article)
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

  const { text: introduction } = await generateText({
    model: google("gemini-1.5-flash"),
    prompt,
  })

  return {
    introduction: introduction.trim(),
    articles: summarizedArticles,
  }
}
