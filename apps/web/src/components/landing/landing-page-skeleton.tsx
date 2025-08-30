// Loading skeleton for landing page during SSR
export function LandingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation Skeleton */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Skeleton */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="h-16 w-96 bg-gray-200 rounded mx-auto mb-6 animate-pulse" />
            <div className="h-6 w-full max-w-3xl bg-gray-200 rounded mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-2/3 max-w-2xl bg-gray-200 rounded mx-auto mb-8 animate-pulse" />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="h-12 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Skeleton */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="h-10 w-80 bg-gray-200 rounded mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-full max-w-3xl bg-gray-200 rounded mx-auto animate-pulse" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-6 bg-gray-50 rounded-xl">
                <div className="h-8 w-8 bg-gray-200 rounded mb-4 animate-pulse" />
                <div className="h-6 w-3/4 bg-gray-200 rounded mb-3 animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loading indicator */}
      <div className="py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading page content...</p>
      </div>
    </div>
  );
}
