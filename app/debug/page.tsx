"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/db"

export default function DebugPage() {
  const [email, setEmail] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Check Supabase connection on load
  useEffect(() => {
    async function checkConnection() {
      try {
        console.log("Checking Supabase connection...")
        const { data, error } = await supabase.from("users").select("count(*)")

        if (error) {
          console.error("Supabase connection error:", error)
          setError(`Supabase connection error: ${error.message}`)
        } else {
          console.log("Supabase connection successful:", data)
          setResult({ connection: "Success", count: data })
        }
      } catch (err) {
        console.error("Error checking Supabase connection:", err)
        setError(`Error checking Supabase connection: ${err instanceof Error ? err.message : "Unknown error"}`)
      }
    }

    checkConnection()
  }, [])

  const handleLookup = async () => {
    if (!email) {
      setError("Please enter an email address")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log(`Looking up user with email: ${email}`)
      const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

      if (error) {
        console.error("Lookup error:", error)
        setError(`Lookup error: ${error.message}`)
      } else if (!data) {
        setError(`No user found with email: ${email}`)
      } else {
        console.log("User found:", data)
        setResult(data)
      }
    } catch (err) {
      console.error("Error during lookup:", err)
      setError(`Error during lookup: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Database Debug</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Supabase Connection</h2>
        {error ? (
          <div className="text-red-500">{error}</div>
        ) : result ? (
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(result, null, 2)}</pre>
        ) : (
          <div>Checking connection...</div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">User Lookup</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="border p-2 rounded flex-grow"
          />
          <button
            onClick={handleLookup}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-blue-300"
          >
            {loading ? "Loading..." : "Lookup"}
          </button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : result ? (
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(result, null, 2)}</pre>
        ) : null}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set"}</p>
          <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set"}</p>
          <p>NEXT_PUBLIC_APP_URL: {process.env.NEXT_PUBLIC_APP_URL || "Not set"}</p>
        </div>
      </div>
    </div>
  )
}
