"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { PreferencesForm } from "@/components/preferences-form"
import { DirectDigestTrigger } from "@/components/direct-digest-trigger"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function PreferencesDebugPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const userId = searchParams.get("userId")

  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [preferencesUpdated, setPreferencesUpdated] = useState(false)

  // Log the initial params
  useEffect(() => {
    console.log("Preferences debug page loaded with params:", { email, userId })
  }, [email, userId])

  // Fetch user data if email is provided
  useEffect(() => {
    async function fetchUserData() {
      if (!email) {
        console.log("No email provided, skipping API call")
        setLoading(false)
        return
      }

      try {
        console.log("Fetching user data for email:", email)
        const response = await fetch(`/api/debug-simple?email=${encodeURIComponent(email)}`)

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("API response:", data)

        if (data.user && data.user.success) {
          console.log("User found:", data.user)
          setUserData(data.user)
        } else {
          console.error("User not found or error:", data.user?.error)
          setError(data.user?.error || "User not found")
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [email])

  // Handle preferences update success
  const handlePreferencesUpdated = () => {
    console.log("Preferences updated successfully")
    setPreferencesUpdated(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Manage Your Preferences (Debug Mode)</h1>

          {loading ? (
            <div>Loading user data...</div>
          ) : error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <PreferencesForm
                userId={userData?.id || userId}
                email={email}
                initialPreferences={
                  userData
                    ? {
                        topics: userData.preferencesTopics || [],
                        sources: userData.preferencesSources || [],
                        frequency: userData.preferencesFrequency || "daily",
                        format: userData.preferencesFormat || "short",
                      }
                    : undefined
                }
                onSuccess={handlePreferencesUpdated}
              />

              {(userData?.id || userId) && email && (
                <DirectDigestTrigger userId={userData?.id || userId || ""} email={email} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
