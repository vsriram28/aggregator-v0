import SubscriptionForm from "@/components/subscription-form"
import { getPopularTopics, getUserCount } from "@/lib/user-service"

export default async function HomePage() {
  // Add error handling for data fetching
  let userCount = 0
  let popularTopics: { topic: string; count: number }[] = []

  try {
    userCount = await getUserCount()
    popularTopics = await getPopularTopics(5)
  } catch (error) {
    console.error("Error fetching data:", error)
    // Continue with default values
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Stay Informed with Personalized News Digests</h1>
            <p className="text-xl text-gray-600">
              Get curated news summaries delivered to your inbox, tailored to your interests using AI.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
            <SubscriptionForm />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
              <ol className="space-y-4 text-gray-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                    1
                  </span>
                  <span>Subscribe with your email and select your interests</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                    2
                  </span>
                  <span>Our AI aggregates relevant news from trusted sources</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                    3
                  </span>
                  <span>Content is summarized and personalized to your preferences</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                    4
                  </span>
                  <span>Receive your digest via email on your preferred schedule</span>
                </li>
              </ol>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-2xl font-semibold mb-4">Popular Topics</h2>
              <div>
                <div className="flex flex-wrap gap-2">
                  {popularTopics.map(({ topic }) => (
                    <span key={topic} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
