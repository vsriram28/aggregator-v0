import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    console.log(`Debug: Looking up user with email: ${email}`)

    // Direct Supabase query
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error) {
      console.error(`Debug: Error fetching user with email ${email}:`, error)
      return NextResponse.json(
        {
          error: "Failed to fetch user",
          details: error,
        },
        { status: 500 },
      )
    }

    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user data with preferences
    return NextResponse.json({
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        created_at: data.created_at,
        preferences: data.preferences,
      },
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json(
      {
        error: "Debug endpoint failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
