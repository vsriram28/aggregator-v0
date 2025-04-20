import type { NewsArticle } from "./db-schema"
import { saveArticles } from "./db"

// News API configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY!
const NEWS_API_URL = "https://newsapi.org/v2"

type NewsAPIResponse = {
  status: string
  totalResults: number
  articles: {
    source: { id: string | null; name: string }
    author: string | null
    title: string
    description: string
    url: string
    urlToImage: string | null
    publishedAt: string
    content: string
  }[]
}

// Map our source names to potential matches in the News API responses
// This helps handle variations in source names between our system and the API
const SOURCE_NAME_MAPPINGS: Record<string, string[]> = {
  BBC: ["BBC", "BBC News", "BBC Sport"],
  CNN: ["CNN", "CNN Business", "CNN Politics"],
  "The Guardian": ["The Guardian", "Guardian", "Guardian US", "Guardian UK"],
  Reuters: ["Reuters", "Reuters UK", "Reuters US"],
  "Associated Press": ["AP", "Associated Press", "AP News"],
  "The New York Times": ["New York Times", "NY Times", "NYT", "The New York Times"],
  "The Washington Post": ["Washington Post", "The Washington Post", "WP"],
  Bloomberg: ["Bloomberg", "Bloomberg.com", "Bloomberg News"],
  CNBC: ["CNBC", "CNBC.com"],
  TechCrunch: ["TechCrunch", "TechCrunch.com"],
  YCombinator: ["Y Combinator", "Hacker News", "YC", "YCombinator"],
  "PBS.org": ["PBS", "PBS News", "PBS.org", "PBS NewsHour"],
}

// Fetch news from News API
async function fetchFromNewsAPI(query: string, preferredSources: string[] = [], pageSize = 5) {
  // We'll fetch more articles than needed to ensure we have enough after filtering by source
  const url = `${NEWS_API_URL}/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize * 2}&apiKey=${NEWS_API_KEY}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`News API error (${response.status}): ${errorText}`)
      throw new Error(`News API error (${response.status}): ${response.statusText}`)
    }

    const data = (await response.json()) as NewsAPIResponse

    // If no preferred sources specified, return all articles (limited to pageSize)
    if (!preferredSources.length) {
      const limitedArticles = data.articles.slice(0, pageSize)
      return mapToNewsArticles(limitedArticles, query)
    }

    // Filter articles by preferred sources
    const filteredArticles = data.articles.filter((article) => {
      const sourceName = article.source.name

      // Check if this source matches any of the user's preferred sources
      return preferredSources.some((preferredSource) => {
        // Direct match
        if (sourceName === preferredSource) return true

        // Check against our mappings
        const possibleMatches = SOURCE_NAME_MAPPINGS[preferredSource] || []
        return possibleMatches.some((match) => sourceName.includes(match))
      })
    })

    console.log(
      `Filtered from ${data.articles.length} to ${filteredArticles.length} articles matching preferred sources`,
    )

    // If we have too few articles after filtering, we might need to fetch more in a real app
    // For now, just return what we have, limited to pageSize
    const limitedArticles = filteredArticles.slice(0, pageSize)

    return mapToNewsArticles(limitedArticles, query)
  } catch (error) {
    console.error(`Error fetching news for query "${query}":`, error)
    throw error
  }
}

// Helper function to map API response to our NewsArticle type
function mapToNewsArticles(articles: NewsAPIResponse["articles"], query: string): Omit<NewsArticle, "id">[] {
  return articles.map((article) => ({
    title: article.title,
    url: article.url,
    source: article.source.name,
    publishedAt: new Date(article.publishedAt),
    published_at: new Date(article.publishedAt),
    content: article.content || article.description,
    topics: [query], // Simple topic assignment based on query
  }))
}

// Fetch news for multiple topics with a limit per topic
export async function fetchNewsForTopics(topics: string[], articlesPerTopic = 5, preferredSources: string[] = []) {
  try {
    console.log(`Fetching news for topics: ${topics.join(", ")} (${articlesPerTopic} articles per topic)`)
    if (preferredSources.length) {
      console.log(`Filtering by preferred sources: ${preferredSources.join(", ")}`)
    }

    const articlesPromises = topics.map((topic) => fetchFromNewsAPI(topic, preferredSources, articlesPerTopic))
    const articlesArrays = await Promise.all(articlesPromises)

    // Flatten and deduplicate articles by URL
    const articlesMap = new Map()

    // Process each topic's articles
    articlesArrays.forEach((articles, index) => {
      const topic = topics[index]
      console.log(`Fetched ${articles.length} articles for topic "${topic}"`)

      // Add each article to the map, preserving topic information
      articles.forEach((article) => {
        if (!articlesMap.has(article.url)) {
          articlesMap.set(article.url, article)
        } else {
          // Merge topics if article already exists
          const existingArticle = articlesMap.get(article.url)
          existingArticle.topics = [...new Set([...existingArticle.topics, ...article.topics])]
        }
      })
    })

    const articles = Array.from(articlesMap.values())
    console.log(`Total unique articles after deduplication: ${articles.length}`)

    // Save articles to database
    await saveArticles(articles)

    return articles as NewsArticle[]
  } catch (error) {
    console.error("Error in fetchNewsForTopics:", error)
    throw error
  }
}
