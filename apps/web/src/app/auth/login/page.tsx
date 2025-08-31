import { LoginClientWrapper } from "@/components/auth/login-client-wrapper";

// Server Component for SEO and initial render
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Static navigation for SEO */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 text-blue-600">🛡️</div>
              <span className="text-xl font-bold text-gray-900">
                Dead Man's Switch
              </span>
            </div>
            <a
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </nav>

      {/* Main content - client-side only to avoid SSR issues */}
      <LoginClientWrapper />
    </div>
  );
}
