// Global loading component for SSR streaming
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
        <p className="text-gray-600">Please wait while we load your content</p>

        {/* Loading progress simulation */}
        <div className="mt-6 w-64 mx-auto">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full animate-pulse"
              style={{ width: "60%" }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Fetching your data...</p>
        </div>
      </div>
    </div>
  );
}
