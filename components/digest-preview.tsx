"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { NewsArticle } from "@/lib/db-schema"

type DigestPreviewProps = {
  email: string
}

type DigestPreviewData = {
  introduction: string
  articles: NewsArticle[]
}

export function DigestPreview({ email }: DigestPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [digest, setDigest] = useState<DigestPreviewData | null>(null)

  useEffect(() => {
    async function fetchPreview() {
      try {
        setLoading(true)
        const response = await fetch(`/api/digest/preview?email=${email}`)

        if (!response.ok) {
          throw new Error("Failed to generate preview")
        }

        const data = await response.json()
        setDigest(data.digest)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchPreview()
  }, [email])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />

        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  if (!digest) {
    return <div>No preview available</div>
  }

  return (
    <div className="space-y-6">
      <div className="prose max-w-none">
        <p className="text-lg">{digest.introduction}</p>
      </div>

      <div className="divide-y">
        {digest.articles.map((article) => (
          <div key={article.url} className="py-4">
            <h3 className="font-semibold text-lg mb-1">{article.title}</h3>
            <p className="text-sm text-gray-500 mb-2">
              From {article.source} • {new Date(article.publishedAt).toLocaleDateString()}
            </p>
            <p className="text-gray-700 mb-2">{article.summary}</p>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Read full article →
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
