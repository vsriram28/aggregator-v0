"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

export default function DebugDigestPage() {
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [isPreferencesUpdated, setIsPreferencesUpdated] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleTriggerDigest = async () => {
    if (!email && !userId) {
      setError("Please provide either an email or user ID")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")
    setResult(null)

    try {
      const params = new URLSearchParams()
      if (email) params.append("email", email)
      if (userId) params.append("userId", userId)
      params.append("isPreferencesUpdated", isPreferencesUpdated.toString())

      const response = await fetch(`/api/debug/trigger-digest?${params.toString()}`)
      const data = await response.json()

      setResult(data)

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to trigger digest")
      }

      setSuccess(`Digest successfully generated and sent to ${data.message || "the user"}`)
    } catch (err) {
      console.error("Error triggering digest:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Debug Digest Generator</h1>

          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional if User ID is provided)</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">User ID (optional if Email is provided)</Label>
              <Input id="userId" placeholder="user-uuid" value={userId} onChange={(e) => setUserId(e.target.value)} />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPreferencesUpdated"
                checked={isPreferencesUpdated}
                onCheckedChange={(checked) => setIsPreferencesUpdated(checked === true)}
              />
              <Label htmlFor="isPreferencesUpdated">Mark as preferences updated digest</Label>
            </div>

            <Button onClick={handleTriggerDigest} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Digest...
                </>
              ) : (
                "Generate and Send Digest"
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200 mb-4">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Response Details:</h2>
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
