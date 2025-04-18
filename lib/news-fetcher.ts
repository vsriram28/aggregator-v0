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
async function fetchFromNewsAPI(query: string, pageSize = 10) {
  const url = `${NEWS_API_URL}/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`News API error: ${response.statusText}`)
  }

  const data = (await response.json()) as NewsAPIResponse

  return data.articles.map((article) => ({
    title: article.title,
    url: article.url,
    source: article.source.name,
    publishedAt: new Date(article.publishedAt),
    content: article.content || article.description,
    topics: [query], // Simple topic assignment based on query
  }))
}

// Fetch news for multiple topics
export async function fetchNewsForTopics(topics: string[]) {
  const articlesPromises = topics.map((topic) => fetchFromNewsAPI(topic))
  const articlesArrays = await Promise.all(articlesPromises)

  // Flatten and deduplicate articles by URL
  const articlesMap = new Map()
  articlesArrays.flat().forEach((article) => {
    if (!articlesMap.has(article.url)) {
      articlesMap.set(article.url, article)
    } else {
      // Merge topics if article already exists
      const existingArticle = articlesMap.get(article.url)
      existingArticle.topics = [...new Set([...existingArticle.topics, ...article.topics])]
    }
  })

  const articles = Array.from(articlesMap.values())

  // Save articles to database
  await saveArticles(articles)

  return articles as NewsArticle[]
}
