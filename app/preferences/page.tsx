import { Suspense } from "react"
import { redirect } from "next/navigation"
import { PreferencesForm } from "@/components/preferences-form"

export default async function PreferencesPage({
  searchParams,
}: {
  searchParams: { userId?: string; email?: string }
}) {
  const { userId, email } = searchParams

  console.log("Preferences page loaded with params:", { userId, email })

  // No server-side validation here - we'll let the client component handle it
  // This is what worked in version 45
  if (!userId && !email) {
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
            <PreferencesForm userId={userId} email={email} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
