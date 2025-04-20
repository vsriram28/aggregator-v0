"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

interface DirectDigestTriggerProps {
  userId: string
  email: string
}

export function DirectDigestTrigger({ userId, email }: DirectDigestTriggerProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (log: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString().split("T")[1].split(".")[0]} - ${log}`])
  }

  const triggerDigest = async () => {
    if (!userId || !email) {
      setStatus("error")
      setMessage("User ID and email are required")
      return
    }

    try {
      setStatus("loading")
      setMessage("Generating your updated digest...")
      addLog(`Starting digest generation for user ${userId} (${email})`)

      // First, try the preferences-updated endpoint
      addLog("Calling /api/digest/preferences-updated endpoint")
      const response = await fetch(`/api/digest/preferences-updated`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()
      addLog(`Response status: ${response.status}`)
      addLog(`Response data: ${JSON.stringify(data)}`)

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate digest")
      }

      setStatus("success")
      setMessage("Your updated digest has been sent to your email!")
      addLog("Digest generation successful")
    } catch (error) {
      console.error("Error triggering digest:", error)
      addLog(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)

      // Try fallback method
      try {
        addLog("Trying fallback method with /api/trigger-preferences-digest")
        const fallbackResponse = await fetch(
          `/api/trigger-preferences-digest?userId=${userId}&email=${encodeURIComponent(email)}`,
        )

        const fallbackData = await fallbackResponse.json()
        addLog(`Fallback response status: ${fallbackResponse.status}`)
        addLog(`Fallback response data: ${JSON.stringify(fallbackData)}`)

        if (!fallbackResponse.ok) {
          throw new Error(fallbackData.error || "Fallback method failed")
        }

        setStatus("success")
        setMessage("Your updated digest has been sent to your email using fallback method!")
        addLog("Fallback digest generation successful")
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError)
        addLog(`Fallback error: ${fallbackError instanceof Error ? fallbackError.message : "Unknown error"}`)
        setStatus("error")
        setMessage(`Could not generate digest: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Digest Preview</h3>
        <Button onClick={triggerDigest} disabled={status === "loading"} className="flex items-center gap-2">
          {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === "loading" ? "Generating..." : "Generate Digest Preview"}
        </Button>
      </div>

      {status === "loading" && (
        <Alert className="bg-blue-50 border-blue-200">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin mr-2" />
          <AlertDescription className="text-blue-700 flex items-center">{message}</AlertDescription>
        </Alert>
      )}

      {status === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">{message}</AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {logs.length > 0 && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md text-sm font-mono overflow-auto max-h-40">
          <h4 className="font-semibold mb-2">Debug Logs:</h4>
          {logs.map((log, i) => (
            <div key={i} className="text-xs">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
