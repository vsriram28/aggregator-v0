"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, InfoIcon } from "lucide-react"
import type { UserPreferences } from "@/lib/db-schema"

// Available topics for selection
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

// Available news sources
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

export default function SubscriptionForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [existingUser, setExistingUser] = useState(false)
  const [userId, setUserId] = useState("")

  // Form state
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily")
  const [format, setFormat] = useState<"short" | "detailed">("short")

  // Check if email exists when user enters email
  const checkExistingUser = async () => {
    if (!email) return

    setLoading(true)
    setError("")
    setInfo("")

    try {
      console.log("Checking if email exists:", email)
      const response = await fetch(`/api/debug-simple?email=${encodeURIComponent(email)}`)

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API response:", data)

      if (data.user && data.user.success) {
        console.log("User found:", data.user)
        setExistingUser(true)
        setUserId(data.user.id)
        setName(data.user.name || "")

        // Load existing preferences
        setSelectedTopics(data.user.preferencesTopics || [])
        setSelectedSources(data.user.preferencesSources || [])
        setFrequency(data.user.preferencesFrequency || "daily")
        setFormat(data.user.preferencesFormat || "short")

        setInfo("We found your existing subscription. Your preferences have been loaded.")
      } else {
        console.log("New user")
        setExistingUser(false)
      }
    } catch (err) {
      console.error("Error checking existing user:", err)
      // Don't show error for new users
    } finally {
      setLoading(false)
    }
  }

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
  const handleSubmit = async () => {
    if (selectedTopics.length === 0) {
      setError("Please select at least one topic")
      return
    }

    if (selectedSources.length === 0) {
      setError("Please select at least one news source")
      return
    }

    setLoading(true)
    setError("")

    try {
      const preferences: UserPreferences = {
        topics: selectedTopics,
        sources: selectedSources,
        frequency,
        format,
      }

      console.log(`Submitting subscription with email: ${email}, existing user: ${existingUser}`)

      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, preferences }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Subscription failed")
      }

      console.log("Subscription successful, redirecting with email:", email)

      // Pass the message and email to the success page
      router.push(
        `/success?message=${encodeURIComponent(data.message)}&isUpdate=${data.isUpdate}&email=${encodeURIComponent(email)}`,
      )
    } catch (err) {
      console.error("Subscription error:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setLoading(false)
    }
  }

  // Handle next step with email check
  const handleNextStep = async () => {
    if (!email) {
      setError("Please enter your email address")
      return
    }

    if (!name) {
      setError("Please enter your name")
      return
    }

    setError("")

    // Check if user exists before proceeding
    await checkExistingUser()

    // Move to next step
    setStep(2)
  }

  return (
    <div>
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Subscribe to News Digest</h2>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <Button className="w-full" onClick={handleNextStep} disabled={loading}>
            {loading ? "Checking..." : "Next"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Select Your Interests</h2>

          {info && (
            <Alert className="bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">{info}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Topics (select at least one)</Label>
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
            <Label>News Sources (select at least one)</Label>
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

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              onClick={() => {
                if (selectedTopics.length === 0 || selectedSources.length === 0) {
                  setError("Please make selections for all fields")
                  return
                }
                setError("")
                setStep(3)
              }}
            >
              Next
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Delivery Preferences</h2>

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

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Subscribing..." : existingUser ? "Update Preferences" : "Subscribe"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}
