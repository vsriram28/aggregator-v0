import { CronJob } from "cron"
import { getUsersByFrequency } from "./user-service"
import { fetchNewsForTopics } from "./news-fetcher"
import { generatePersonalizedDigest } from "./llm-service"
import { sendDigestEmail } from "./email-service"
import { saveDigest } from "./db"

// Process digests for users with a specific frequency
async function processDigestsForFrequency(frequency: "daily" | "weekly") {
  console.log(`Processing ${frequency} digests...`)

  // Get all users with this frequency preference
  const users = await getUsersByFrequency(frequency)

  for (const user of users) {
    try {
      // Fetch news based on user preferences
      const articles = await fetchNewsForTopics(user.preferences.topics)

      // Generate personalized digest
      const { introduction, articles: summarizedArticles } = await generatePersonalizedDigest(
        articles,
        user.preferences,
      )

      // Save digest to database
      const digest = await saveDigest({
        userId: user.id,
        createdAt: new Date(),
        articles: summarizedArticles,
        summary: introduction,
      })

      // Send email
      await sendDigestEmail(user, digest)

      console.log(`Sent digest to ${user.email}`)
    } catch (error) {
      console.error(`Error processing digest for user ${user.id}:`, error)
    }
  }
}

// Initialize cron jobs
export function initializeScheduler() {
  // Daily digest at 8:00 AM
  new CronJob(
    "0 8 * * *",
    () => {
      processDigestsForFrequency("daily")
    },
    null,
    true,
  )

  // Weekly digest on Sunday at 9:00 AM
  new CronJob(
    "0 9 * * 0",
    () => {
      processDigestsForFrequency("weekly")
    },
    null,
    true,
  )

  console.log("Scheduler initialized")
}
