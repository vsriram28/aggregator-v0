"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function UnsubscribePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [confirming, setConfirming] = useState(true)

  // Handle unsubscribe confirmation
  const handleUnsubscribe = async () => {
    if (!email) {
      setError("Email is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to unsubscribe")
      }

      setSuccess(true)
      setConfirming(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // If no email is provided, show an error
  if (!email && !loading && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Request</h1>
          <p className="text-gray-600 mb-6">No email address was provided for unsubscription.</p>
          <Link href="/" passHref>
            <Button variant="outline" className="w-full">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center">
        {confirming && !success ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unsubscribe Confirmation</h1>
            <p className="text-gray-600 mb-6">
              Are you sure you want to unsubscribe <strong>{email}</strong> from receiving news digests?
            </p>

            <div className="space-y-3">
              <Button onClick={handleUnsubscribe} disabled={loading} className="w-full">
                {loading ? "Processing..." : "Yes, Unsubscribe Me"}
              </Button>
              <Link href="/" passHref>
                <Button variant="outline" className="w-full">
                  No, Keep My Subscription
                </Button>
              </Link>
            </div>

            {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribed Successfully</h1>
            <p className="text-gray-600 mb-6">
              You have been unsubscribed from our news digest service. We're sorry to see you go!
            </p>

            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                Changed your mind? You can always subscribe again from our homepage.
              </p>
              <Link href="/" passHref>
                <Button variant="outline" className="w-full">
                  Return to Home
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
