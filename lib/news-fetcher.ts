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

// Fetch news from News API
async function fetchFromNewsAPI(query: string, pageSize = 5) {
  // Changed default to 5
  const url = `${NEWS_API_URL}/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`News API error (${response.status}): ${errorText}`)
      throw new Error(`News API error (${response.status}): ${response.statusText}`)
    }

    const data = (await response.json()) as NewsAPIResponse

    // Limit to exactly pageSize articles
    const limitedArticles = data.articles.slice(0, pageSize)

    return limitedArticles.map((article) => ({
      title: article.title,
      url: article.url,
      source: article.source.name,
      publishedAt: new Date(article.publishedAt),
      published_at: new Date(article.publishedAt),
      content: article.content || article.description,
      topics: [query], // Simple topic assignment based on query
    }))
  } catch (error) {
    console.error(`Error fetching news for query "${query}":`, error)
    throw error
  }
}

// Fetch news for multiple topics with a limit per topic
export async function fetchNewsForTopics(topics: string[], articlesPerTopic = 5) {
  try {
    console.log(`Fetching news for topics: ${topics.join(", ")} (${articlesPerTopic} articles per topic)`)

    const articlesPromises = topics.map((topic) => fetchFromNewsAPI(topic, articlesPerTopic))
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
