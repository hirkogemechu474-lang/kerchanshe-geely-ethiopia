export default function PublicRootLoading() {
  return (
    <div className="flex flex-col min-h-screen animate-pulse">
      {/* Fake header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-midnight-surface/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <div className="h-9 w-32 rounded bg-slate-100" />
          <div className="hidden lg:flex items-center gap-6 flex-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-4 w-16 bg-slate-100 rounded" />
            ))}
          </div>
          <div className="h-10 w-28 rounded-lg bg-slate-100 ml-auto" />
        </div>
      </div>

      {/* Hero placeholder */}
      <div className="min-h-[70vh] bg-mesh-blue flex items-center">
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div className="h-5 w-24 rounded-full bg-white dark:bg-midnight-surface/10" />
            <div className="h-16 w-full rounded-lg bg-white dark:bg-midnight-surface/10" />
            <div className="h-6 w-11/12 rounded bg-white dark:bg-midnight-surface/10" />
            <div className="h-6 w-9/12 rounded bg-white dark:bg-midnight-surface/5" />
            <div className="pt-3 flex gap-3">
              <div className="h-12 w-48 rounded-xl bg-white dark:bg-midnight-surface/10" />
              <div className="h-12 w-40 rounded-xl bg-active-blue/20" />
            </div>
          </div>
          <div className="aspect-[4/3] rounded-3xl bg-white dark:bg-midnight-surface/5 ring-1 ring-white/10" />
        </div>
      </div>

      {/* Sections */}
      <section className="py-20 bg-white dark:bg-midnight-surface">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 rounded-3xl bg-slate-100" />
            ))}
          </div>
        </div>
      </section>

      {/* Footer placeholder */}
      <div className="mt-auto bg-black">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-24 rounded bg-white dark:bg-midnight-surface/10" />
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-3 w-32 rounded bg-white dark:bg-midnight-surface/5" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
