import { Suspense } from "react"
import { DigestPreview } from "@/components/digest-preview"

export default function PreviewPage({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  const { email } = searchParams

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-6">Digest Preview</h1>
            <p>Please provide your email address to view a preview of your digest.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Digest Preview</h1>

          <Suspense fallback={<div>Generating your preview...</div>}>
            <DigestPreview email={email} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
