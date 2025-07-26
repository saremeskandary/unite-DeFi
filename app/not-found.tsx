import Layout from "@/components/layout"
import Link from "next/link"

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link href="/" className="px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors">
          Return to Home
        </Link>
      </div>
    </Layout>
  )
}
