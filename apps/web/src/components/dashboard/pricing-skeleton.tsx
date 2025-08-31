"use client";

export function PricingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header Skeleton */}
        <div className="text-center mb-20">
          <div className="h-12 w-96 bg-gray-200 rounded-lg animate-pulse mx-auto mb-4" />
          <div className="h-6 w-2/3 bg-gray-200 rounded-lg animate-pulse mx-auto" />
        </div>

        {/* Current Plan Skeleton */}
        <div className="bg-gray-50 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mx-auto mb-8" />
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-5 w-64 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards Skeleton */}
        <div className="py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg"
              >
                <div className="text-center mb-6">
                  <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse mx-auto mb-2" />
                  <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse mx-auto mb-3" />
                  <div className="h-5 w-32 bg-gray-200 rounded-lg animate-pulse mx-auto" />
                </div>

                <div className="space-y-3 mb-8">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex items-center">
                      <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse mr-3" />
                      <div className="h-4 w-full bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                  ))}
                </div>

                <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Feature Comparison Skeleton */}
        <div className="bg-gray-50 py-20">
          <div className="text-center mb-16">
            <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse mx-auto mb-4" />
            <div className="h-5 w-96 bg-gray-200 rounded-lg animate-pulse mx-auto" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-6">
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-6 bg-gray-200 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="grid grid-cols-4 gap-4 items-center">
                  <div className="h-5 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse mx-auto" />
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse mx-auto" />
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Skeleton */}
        <div className="py-20">
          <div className="text-center mb-16">
            <div className="h-10 w-80 bg-gray-200 rounded-lg animate-pulse mx-auto mb-4" />
            <div className="h-5 w-64 bg-gray-200 rounded-lg animate-pulse mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg"
              >
                <div className="h-6 w-3/4 bg-gray-200 rounded-lg animate-pulse mb-3" />
                <div className="h-16 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
