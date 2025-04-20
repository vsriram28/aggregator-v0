export default function DebugSimplePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Simple Debug Page</h1>
      <p>This page is working if you can see this text.</p>

      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Next Steps:</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Check if this simple page loads correctly</li>
          <li>Check browser console for errors on the preferences page</li>
          <li>
            Try accessing the API directly: <code>/api/debug/user?email=your@email.com</code>
          </li>
        </ol>
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Public Environment Variables:</h2>
        <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set"}</p>
        <p>NEXT_PUBLIC_APP_URL: {process.env.NEXT_PUBLIC_APP_URL || "Not set"}</p>
      </div>
    </div>
  )
}
