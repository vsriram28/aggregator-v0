"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Loader2 } from "lucide-react"

interface PreferencesUpdatedTriggerProps {
  userId?: string
  email?: string
  show: boolean
}

export function PreferencesUpdatedTrigger({ userId, email, show }: PreferencesUpdatedTriggerProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function triggerDigest() {
      if (!show || !userId) return

      try {
        setStatus("loading")
        setMessage("Generating your updated digest...")

        console.log(`Triggering preferences updated digest for user: ${userId}`)

        // Call the preferences-updated digest endpoint
        const response = await fetch(`/api/digest/preferences-updated`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate digest")
        }

        const data = await response.json()
        console.log("Digest generation response:", data)

        setStatus("success")
        setMessage("Your updated digest has been sent to your email!")
      } catch (error) {
        console.error("Error triggering digest:", error)
        setStatus("error")
        setMessage(`Could not generate digest: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    triggerDigest()
  }, [userId, show])

  if (!show) return null

  return (
    <div className="mt-4">
      {status === "loading" && (
        <Alert className="bg-blue-50 border-blue-200">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin mr-2" />
          <AlertDescription className="text-blue-700 flex items-center">{message}</AlertDescription>
        </Alert>
      )}

      {status === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
          <AlertDescription className="text-green-700 flex items-center">{message}</AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-700">{message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
