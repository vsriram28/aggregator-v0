import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    // Basic connection test
    const connectionTest = await testConnection()

    // User lookup if email provided
    let userLookup = null
    if (email) {
      userLookup = await lookupUser(email)
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      connection: connectionTest,
      user: userLookup,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.SUPABASE_URL || !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey:
          !!process.env.SUPABASE_SERVICE_ROLE_KEY ||
          !!process.env.SUPABASE_ANON_KEY ||
          !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      },
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json(
      {
        error: "Debug API failed",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

async function testConnection() {
  try {
    const { data, error } = await supabase.from("users").select("count(*)", { count: "exact", head: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, count: data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function lookupUser(email: string) {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: "User not found" }
    }

    return {
      success: true,
      id: data.id,
      email: data.email,
      name: data.name,
      hasPreferences: !!data.preferences,
      preferencesTopics: data.preferences?.topics || [],
      preferencesSources: data.preferences?.sources || [],
      preferencesFrequency: data.preferences?.frequency || null,
      preferencesFormat: data.preferences?.format || null,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
