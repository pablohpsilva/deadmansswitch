import Link from "next/link";

// Server Component for 404 pages
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-700 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          {/* 404 Icon */}
          <div className="text-6xl mb-4">🔍</div>

          <h1 className="text-2xl font-bold text-gray-100 mb-4">
            Page Not Found
          </h1>

          <p className="text-gray-300 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Go to Dashboard
            </Link>

            <Link
              href="/"
              className="block w-full border border-gray-600 text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Homepage
            </Link>
          </div>

          {/* Helpful links */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-sm font-semibold text-gray-100 mb-3">
              Popular Pages
            </h3>
            <div className="space-y-2 text-sm">
              <Link
                href="/auth/login"
                className="block text-blue-600 hover:text-blue-700"
              >
                Sign In
              </Link>
              <Link
                href="/#features"
                className="block text-blue-600 hover:text-blue-700"
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                className="block text-blue-600 hover:text-blue-700"
              >
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
