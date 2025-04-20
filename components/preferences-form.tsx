"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { UserPreferences } from "@/lib/db-schema"

// Available topics and sources
const AVAILABLE_TOPICS = [
  "Technology",
  "Business",
  "Science",
  "Health",
  "Politics",
  "Entertainment",
  "Sports",
  "Environment",
  "Education",
  "Travel",
]

const AVAILABLE_SOURCES = [
  "BBC",
  "CNN",
  "The Guardian",
  "Reuters",
  "Associated Press",
  "The New York Times",
  "The Washington Post",
  "Bloomberg",
  "CNBC",
  "TechCrunch",
  "YCombinator",
  "PBS.org",
]

export function PreferencesForm({
  userId,
  email,
}: {
  userId?: string
  email?: string
}) {
  const router = useRouter()

  // State for form data and UI
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [userEmail, setUserEmail] = useState(email || "")
  const [foundUserId, setFoundUserId] = useState(userId || "")
  const [unsubscribe, setUnsubscribe] = useState(false)
  const [unsubscribeConfirm, setUnsubscribeConfirm] = useState(false)
  const [sendDigest, setSendDigest] = useState(true)

  // Preferences state
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily")
  const [format, setFormat] = useState<"short" | "detailed">("short")

  // Fetch user preferences directly from API
  useEffect(() => {
    async function fetchUserPreferences() {
      if (!userEmail && !foundUserId) {
        setLoading(false)
        return
      }

      try {
        console.log("Fetching preferences for:", userEmail)

        // Use the debug API endpoint that we know works
        const response = await fetch(`/api/debug-simple?email=${encodeURIComponent(userEmail)}`)

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("API response:", data)

        if (data.user && data.user.success) {
          console.log("User found:", data.user)
          setFoundUserId(data.user.id)
          setSelectedTopics(data.user.preferencesTopics || [])
          setSelectedSources(data.user.preferencesSources || [])
          setFrequency(data.user.preferencesFrequency || "daily")
          setFormat(data.user.preferencesFormat || "short")
        } else {
          console.error("User not found or error:", data.user?.error)
          throw new Error(data.user?.error || "User not found")
        }
      } catch (err) {
        console.error("Error fetching preferences:", err)
        setError(`Could not load preferences: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    fetchUserPreferences()
  }, [userEmail, foundUserId])

  // Handle topic selection
  const handleTopicChange = (topic: string, checked: boolean) => {
    if (checked) {
      setSelectedTopics([...selectedTopics, topic])
    } else {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic))
    }
  }

  // Handle source selection
  const handleSourceChange = (source: string, checked: boolean) => {
    if (checked) {
      setSelectedSources([...selectedSources, source])
    } else {
      setSelectedSources(selectedSources.filter((s) => s !== source))
    }
  }

  // Handle unsubscribe
  const handleUnsubscribe = async () => {
    if (!userEmail && !foundUserId) {
      setError("Email is required to unsubscribe")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to unsubscribe")
      }

      setSuccess("You have been successfully unsubscribed from the news digest service.")
      setUnsubscribeConfirm(true)
      // Clear form data
      setSelectedTopics([])
      setSelectedSources([])
      setFoundUserId("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setSaving(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (unsubscribe) {
      handleUnsubscribe()
      return
    }

    if (selectedTopics.length === 0) {
      setError("Please select at least one topic")
      return
    }

    if (selectedSources.length === 0) {
      setError("Please select at least one news source")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const preferences: Partial<UserPreferences> = {
        topics: selectedTopics,
        sources: selectedSources,
        frequency,
        format,
      }

      console.log("Updating preferences with:", {
        userId: foundUserId,
        preferences,
        sendDigest,
      })

      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: foundUserId,
          preferences,
          sendDigest,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update preferences")
      }

      setSuccess(
        sendDigest
          ? "Preferences updated successfully! A digest based on your new preferences will be sent to your email shortly."
          : "Preferences updated successfully!",
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setSaving(false)
    }
  }

  // Handle lookup by email
  const handleLookup = async () => {
    if (!userEmail) {
      setError("Please enter your email address")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("Looking up user with email:", userEmail)

      // Use the debug API endpoint
      const response = await fetch(`/api/debug-simple?email=${encodeURIComponent(userEmail)}`)

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Lookup response:", data)

      if (data.user && data.user.success) {
        console.log("User found:", data.user)
        setFoundUserId(data.user.id)
        setSelectedTopics(data.user.preferencesTopics || [])
        setSelectedSources(data.user.preferencesSources || [])
        setFrequency(data.user.preferencesFrequency || "daily")
        setFormat(data.user.preferencesFormat || "short")
      } else {
        console.error("User not found or error:", data.user?.error)
        throw new Error(data.user?.error || "User not found")
      }
    } catch (err) {
      console.error("Error looking up user:", err)
      setError(`User not found. Please check your email address. ${err instanceof Error ? err.message : ""}`)
    } finally {
      setLoading(false)
    }
  }

  // Render unsubscribe confirmation
  if (unsubscribeConfirm) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Unsubscribed Successfully</AlertTitle>
          <AlertDescription className="text-green-700">
            You have been unsubscribed from our news digest service. We're sorry to see you go!
          </AlertDescription>
        </Alert>

        <p className="text-center text-gray-600 mt-4">
          Changed your mind? You can always subscribe again from our homepage.
        </p>

        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => router.push("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  // Render email lookup form if no user ID is found
  if (!foundUserId && !loading) {
    return (
      <div className="space-y-4">
        <p className="text-gray-600">Enter your email address to manage your preferences:</p>

        <div className="space-y-2">
          <Label htmlFor="lookup-email">Email</Label>
          <div className="flex gap-2">
            <Input
              id="lookup-email"
              type="email"
              placeholder="your@email.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
            <Button onClick={handleLookup}>Look Up</Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // Render loading state
  if (loading) {
    return <div>Loading preferences...</div>
  }

  // Render the main preferences form
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!unsubscribe ? (
        <>
          <div className="space-y-2">
            <Label>Topics</Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_TOPICS.map((topic) => (
                <div key={topic} className="flex items-center space-x-2">
                  <Checkbox
                    id={`topic-${topic}`}
                    checked={selectedTopics.includes(topic)}
                    onCheckedChange={(checked) => handleTopicChange(topic, checked === true)}
                  />
                  <Label htmlFor={`topic-${topic}`} className="text-sm">
                    {topic}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>News Sources</Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_SOURCES.map((source) => (
                <div key={source} className="flex items-center space-x-2">
                  <Checkbox
                    id={`source-${source}`}
                    checked={selectedSources.includes(source)}
                    onCheckedChange={(checked) => handleSourceChange(source, checked === true)}
                  />
                  <Label htmlFor={`source-${source}`} className="text-sm">
                    {source}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <RadioGroup value={frequency} onValueChange={(value) => setFrequency(value as "daily" | "weekly")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily">Daily</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly">Weekly</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as "short" | "detailed")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="short" id="short" />
                <Label htmlFor="short">Short summaries</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed">Detailed analysis</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-digest"
                checked={sendDigest}
                onCheckedChange={(checked) => setSendDigest(checked === true)}
              />
              <Label htmlFor="send-digest" className="text-sm">
                Send me a digest based on my new preferences
              </Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              If checked, you'll receive a digest email shortly after updating your preferences
            </p>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Confirm Unsubscribe</AlertTitle>
            <AlertDescription className="text-red-700">
              Are you sure you want to unsubscribe from the news digest service? This action cannot be undone.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="border-t pt-4">
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="unsubscribe"
            checked={unsubscribe}
            onCheckedChange={(checked) => setUnsubscribe(checked === true)}
          />
          <Label htmlFor="unsubscribe" className="font-medium text-red-600">
            Unsubscribe from news digest service
          </Label>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => router.push("/")}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : unsubscribe ? "Confirm Unsubscribe" : "Save Preferences"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && !unsubscribeConfirm && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}
