export default function AboutLoading() {
  return (
    <main className="flex-1 animate-pulse">
      {/* Hero skeleton */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-navy via-blue-900 to-geely-blue">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-5">
            <div className="h-4 w-24 rounded-full bg-white dark:bg-midnight-surface/10" />
            <div className="h-14 sm:h-20 w-full rounded-md bg-white dark:bg-midnight-surface/10" />
            <div className="h-6 w-11/12 rounded bg-white dark:bg-midnight-surface/10" />
            <div className="h-6 w-9/12 rounded bg-white dark:bg-midnight-surface/5" />
          </div>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-midnight-surface">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="h-4 w-32 rounded-full bg-gold/20" />
              <div className="h-12 w-full rounded bg-slate-200" />
              <div className="h-5 w-full rounded bg-slate-100" />
              <div className="h-5 w-11/12 rounded bg-slate-100" />
              <div className="h-5 w-10/12 rounded bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-slate-100" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-navy/95">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="h-10 w-96 mx-auto rounded bg-white dark:bg-midnight-surface/10" />
            <div className="h-5 w-11/12 mx-auto rounded bg-white dark:bg-midnight-surface/5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-60 rounded-3xl bg-white dark:bg-midnight-surface/5" />
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-3xl bg-slate-100" />
          ))}
        </div>
      </div>
    </main>
  );
}
