export default function AdminRootLoading() {
  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      {/* Fake sidebar */}
      <div className="flex gap-6">
        {/* Left sidebar skeleton */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-9 rounded-lg bg-white border border-gray-200 animate-pulse"
                style={{ width: `${70 + (i % 4) * 10}%` }}
              />
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className="h-8 w-56 bg-slate-200 rounded-md animate-pulse" />
              <div className="h-4 w-96 max-w-full bg-slate-100 rounded-md animate-pulse" />
            </div>
            <div className="h-10 w-40 bg-slate-200 rounded-xl animate-pulse" />
          </div>

          {/* Card skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-200 p-5 space-y-4 animate-pulse">
                <div className="w-11 h-11 rounded-xl bg-slate-200" />
                <div className="h-5 w-20 bg-slate-200 rounded" />
                <div className="h-9 w-28 bg-slate-100 rounded" />
              </div>
            ))}
          </div>

          {/* Long block skeleton */}
          <div className="rounded-2xl bg-white border border-gray-200 p-6 space-y-5 animate-pulse">
            <div className="h-7 w-48 bg-slate-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                  <div className="h-10 rounded-lg bg-slate-100" />
                </div>
              ))}
            </div>
            <div className="h-36 rounded-xl bg-slate-100 mt-4" />
          </div>

          <div className="h-36 rounded-2xl bg-white border border-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
