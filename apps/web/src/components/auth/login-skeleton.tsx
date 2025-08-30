// Loading skeleton for login page during SSR
export function LoginSkeleton() {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header Skeleton */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse" />
            <div className="h-7 w-32 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 rounded mx-auto animate-pulse" />
          </div>

          {/* Form Skeleton */}
          <div className="space-y-4">
            <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />

            <div className="text-center pt-4">
              <div className="h-4 w-64 bg-gray-200 rounded mx-auto animate-pulse" />
            </div>
          </div>

          {/* Security Notice Skeleton */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse mt-0.5" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
