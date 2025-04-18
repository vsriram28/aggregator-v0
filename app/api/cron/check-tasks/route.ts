import { NextResponse } from "next/server"

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    const fullBaseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`

    // Call the task checker endpoint
    const response = await fetch(`${fullBaseUrl}/api/tasks/schedule`, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error(`Failed to check tasks: ${response.statusText}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      tasksChecked: true,
      activeTasks: result.activeTasks,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking tasks:", error)
    return NextResponse.json(
      {
        error: "Failed to check tasks",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
