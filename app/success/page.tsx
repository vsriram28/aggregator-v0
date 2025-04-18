import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { message?: string; isUpdate?: string }
}) {
  const message = searchParams.message || "Subscription successful!"
  const isUpdate = searchParams.isUpdate === "true"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isUpdate ? "Preferences Updated!" : "Subscription Successful!"}
        </h1>
        <p className="text-gray-600 mb-6">
          {isUpdate
            ? "Your preferences have been updated successfully. We've sent a confirmation email to your inbox."
            : "Thank you for subscribing to our personalized news digest. We've sent a confirmation email to your inbox. You'll start receiving regular updates according to your preferences."}
        </p>

        <div className="space-y-3">
          <Link href="/preferences" passHref>
            <Button variant="outline" className="w-full">
              Manage Preferences
            </Button>
          </Link>

          <Link href="/" passHref>
            <Button variant="ghost" className="w-full">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
