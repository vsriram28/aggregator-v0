"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { UserPreferences } from "@/lib/db-schema"

// Available topics and sources (same as subscription form)
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
]

export function PreferencesForm({
  userId,
  email,
}: {
  userId?: string
  email?: string
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [userEmail, setUserEmail] = useState(email || "")
  const [foundUserId, setFoundUserId] = useState(userId || "")

  // Preferences state
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily")
  const [format, setFormat] = useState<"short" | "detailed">("short")

  // Fetch user preferences
  useEffect(() => {
    async function fetchPreferences() {
      if (!userEmail && !foundUserId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/preferences?email=${userEmail}`)

        if (!response.ok) {
          throw new Error("Failed to fetch preferences")
        }

        const data = await response.json()
        const { preferences } = data

        setSelectedTopics(preferences.topics || [])
        setSelectedSources(preferences.sources || [])
        setFrequency(preferences.frequency || "daily")
        setFormat(preferences.format || "short")

        setLoading(false)
      } catch (err) {
        setError("Could not load preferences. Please check your email address.")
        setLoading(false)
      }
    }

    if (userEmail || foundUserId) {
      fetchPreferences()
    }
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: foundUserId, preferences }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update preferences")
      }

      setSuccess("Preferences updated successfully!")
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
      const response = await fetch(`/api/preferences?email=${userEmail}`)

      if (!response.ok) {
        throw new Error("User not found")
      }

      const data = await response.json()
      const { preferences, userId } = data

      setFoundUserId(userId)
      setSelectedTopics(preferences.topics || [])
      setSelectedSources(preferences.sources || [])
      setFrequency(preferences.frequency || "daily")
      setFormat(preferences.format || "short")
    } catch (err) {
      setError("User not found. Please check your email address.")
    } finally {
      setLoading(false)
    }
  }

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

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    )
  }

  if (loading) {
    return <div>Loading preferences...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Preferences"}
      </Button>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}
    </form>
  )
}
