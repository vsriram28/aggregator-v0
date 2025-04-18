import { type NextRequest, NextResponse } from "next/server"

// Store scheduled tasks with their execution times
const scheduledTasks: Map<
  string,
  {
    executeAt: number
    taskFn: () => Promise<void>
    executed: boolean
  }
> = new Map()

// Function to check and execute due tasks
async function executeDueTasks() {
  const now = Date.now()

  for (const [taskId, task] of scheduledTasks.entries()) {
    if (!task.executed && task.executeAt <= now) {
      console.log(`Executing scheduled task: ${taskId}`)

      try {
        task.executed = true
        await task.taskFn()
        console.log(`Task ${taskId} executed successfully`)
      } catch (error) {
        console.error(`Error executing task ${taskId}:`, error)
      }
    }
  }
}

// Schedule a task to run after a delay
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, delayMs, endpoint, method = "GET", payload } = body

    if (!taskId || !delayMs || !endpoint) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const executeAt = Date.now() + delayMs

    // Create the task function
    const taskFn = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
      const fullBaseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`
      const url = endpoint.startsWith("http") ? endpoint : `${fullBaseUrl}${endpoint}`

      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      }

      if (payload && method !== "GET") {
        options.body = JSON.stringify(payload)
      }

      const response = await fetch(url, options)

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`)
      }

      return response.json()
    }

    // Store the task
    scheduledTasks.set(taskId, {
      executeAt,
      taskFn,
      executed: false,
    })

    console.log(`Task ${taskId} scheduled to execute at ${new Date(executeAt).toISOString()}`)

    // Start checking for due tasks
    executeDueTasks()

    return NextResponse.json({
      success: true,
      taskId,
      scheduledFor: new Date(executeAt).toISOString(),
    })
  } catch (error) {
    console.error("Error scheduling task:", error)
    return NextResponse.json({ error: "Failed to schedule task" }, { status: 500 })
  }
}

// Check for due tasks
export async function GET() {
  try {
    await executeDueTasks()

    // Count active tasks
    let activeCount = 0
    for (const task of scheduledTasks.values()) {
      if (!task.executed) {
        activeCount++
      }
    }

    return NextResponse.json({
      success: true,
      activeTasks: activeCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking tasks:", error)
    return NextResponse.json({ error: "Failed to check tasks" }, { status: 500 })
  }
}
