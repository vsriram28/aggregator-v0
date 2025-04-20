import { Suspense } from "react"
import { redirect } from "next/navigation"
import { PreferencesForm } from "@/components/preferences-form"
import { getUserByEmail } from "@/lib/db"

export default async function PreferencesPage({
  searchParams,
}: {
  searchParams: { userId?: string; email?: string }
}) {
  const { userId, email } = searchParams

  console.log("Preferences page loaded with params:", { userId, email })

  // If email is provided, fetch the user to verify they exist and get their preferences
  let userPreferences = null
  let foundUserId = userId

  if (email) {
    try {
      console.log(`Attempting to fetch user with email: ${email}`)
      const user = await getUserByEmail(email)
      console.log(`Found user: ${user.id} with preferences:`, user.preferences)
      userPreferences = user.preferences
      foundUserId = user.id
    } catch (error) {
      console.error(`Error fetching user with email ${email}:`, error)
      // User doesn't exist, redirect to home page
      console.log(`User with email ${email} not found, redirecting to home`)
      redirect("/")
    }
  } else if (!userId) {
    // No email or userId provided, redirect to home
    console.log("No email or userId provided, redirecting to home")
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Manage Your Preferences</h1>

          <Suspense fallback={<div>Loading preferences...</div>}>
            <PreferencesForm userId={foundUserId} email={email} initialPreferences={userPreferences} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
