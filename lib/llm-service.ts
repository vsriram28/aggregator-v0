import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import type { NewsArticle, UserPreferences } from "./db-schema"

// Get the API key from multiple possible environment variables
const getGoogleApiKey = () => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error("No Google API key found in environment variables")
    throw new Error("Google Generative AI API key is missing")
  }

  return apiKey
}

// Create a model with explicit API key
const getGoogleModel = (modelName = "gemini-1.5-flash") => {
  try {
    return google(modelName, { apiKey: getGoogleApiKey() })
  } catch (error) {
    console.error("Error creating Google model:", error)
    throw error
  }
}

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
      model: getGoogleModel(),
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
export async function generatePersonalizedDigest(
  articles: NewsArticle[],
  preferences: UserPreferences,
  isWelcomeDigest = false,
  userName = "there", // Add default name parameter
) {
  try {
    console.log(`Generating digest for ${userName}, isWelcomeDigest: ${isWelcomeDigest}`)

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

    // Create a string with article details to include in the prompt
    const articleDetails = summarizedArticles
      .map(
        (article, index) =>
          `${index + 1}. "${article.title}" from ${article.source}: ${article.summary?.substring(0, 100)}...`,
      )
      .join("\n")

    let prompt = ""

    if (isWelcomeDigest) {
      // Special welcome digest introduction with user's name and actual article details
      prompt = `
        Create a personalized welcome news digest introduction for ${userName} who is interested in ${topicsString}.
        This is their first digest after signing up, so make it especially welcoming and engaging.
        The digest contains these ${summarizedArticles.length} articles in a ${format} format:
        
        ${articleDetails}
        
        Explain that this is a special welcome digest, and that future digests will arrive according to their chosen schedule (${preferences.frequency}).
        Make it engaging and personal, highlighting why these news items are relevant to their interests.
        DO NOT use placeholders like [Subscriber Name] or [Headline]. Use the actual user's name and refer to the actual articles by title or content.
        Keep it under 150 words.
      `
    } else {
      // Regular digest introduction
      prompt = `
        Create a personalized news digest introduction for ${userName} who is interested in ${topicsString}.
        The digest contains these ${summarizedArticles.length} articles in a ${format} format:
        
        ${articleDetails}
        
        Make it engaging and personal, highlighting why these news items are relevant to their interests.
        DO NOT use placeholders like [Subscriber Name] or [Headline]. Use the actual user's name and refer to the actual articles by title or content.
        Keep it under 150 words.
      `
    }

    try {
      console.log("Sending prompt to LLM:", prompt.substring(0, 200) + "...")

      const { text: introduction } = await generateText({
        model: getGoogleModel(),
        prompt,
      })

      console.log("Received introduction from LLM:", introduction.substring(0, 100) + "...")

      return {
        introduction: introduction.trim(),
        articles: summarizedArticles,
      }
    } catch (error) {
      console.error("Error generating introduction:", error)
      // Provide a fallback introduction
      const fallbackIntro = isWelcomeDigest
        ? `Welcome to your first news digest on ${topicsString}, ${userName}! We've gathered ${summarizedArticles.length} articles that match your interests. Future digests will arrive on your chosen ${preferences.frequency} schedule.`
        : `Here's your ${format} news digest on ${topicsString}, ${userName}. We've gathered ${summarizedArticles.length} articles that match your interests.`

      console.log("Using fallback introduction:", fallbackIntro)

      return {
        introduction: fallbackIntro,
        articles: summarizedArticles,
      }
    }
  } catch (error) {
    console.error("Error in generatePersonalizedDigest:", error)
    throw error
  }
}
