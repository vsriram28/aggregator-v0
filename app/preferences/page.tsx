import { Suspense } from "react"
import { redirect } from "next/navigation"
import { PreferencesForm } from "@/components/preferences-form"

export default function PreferencesPage({
  searchParams,
}: {
  searchParams: { userId?: string; email?: string }
}) {
  const { userId, email } = searchParams

  console.log("Preferences page loaded with params:", { userId, email })

  // Simple validation - we need at least one of userId or email
  if (!userId && !email) {
    console.log("No userId or email provided, redirecting to home")
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
