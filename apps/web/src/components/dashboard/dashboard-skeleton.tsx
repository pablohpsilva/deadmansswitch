// Dashboard loading skeleton for SSR and initial load
export function DashboardSkeleton() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="space-y-2">
              <div className="h-10 bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-10 bg-gray-700 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Tier Limits Skeleton */}
          <div className="bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 animate-pulse" />
              </div>
              <div className="pt-3 border-t">
                <div className="h-4 w-20 bg-gray-200 rounded mb-3 animate-pulse" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="lg:col-span-3">
          <div className="bg-gray-800 rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="h-6 w-48 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex space-x-3">
                  <div className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              </div>

              {/* Email list skeleton */}
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                          <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
                        </div>

                        <div className="space-y-1">
                          <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 w-36 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
