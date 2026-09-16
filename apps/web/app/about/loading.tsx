export default function AboutLoading() {
  return (
    <main className="flex-1 animate-pulse">
      {/* Hero skeleton — centered layout */}
      <section className="min-h-[68vh] flex items-center bg-gradient-to-br from-black via-[#101318] to-[#194bff]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-10 lg:px-16 py-24 w-full">
          <div className="max-w-4xl mx-auto text-center space-y-5">
            <div className="h-3 w-28 mx-auto rounded-full bg-white/10" />
            <div className="h-12 sm:h-16 w-full max-w-2xl mx-auto rounded bg-white/10" />
            <div className="h-5 w-11/12 mx-auto rounded bg-white/5" />
            <div className="h-5 w-9/12 mx-auto rounded bg-white/5" />
          </div>
        </div>
      </section>

      {/* Stats bar skeleton */}
      <section className="bg-black border-b border-white/15">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/20">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="py-8 sm:py-10 px-4 sm:px-8 first:pl-0">
                <div className="h-10 w-20 rounded bg-white/10 mb-2" />
                <div className="h-3 w-24 rounded bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Overview skeleton */}
      <section className="py-24 bg-white dark:bg-midnight-surface">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="h-3 w-20 rounded-full bg-geely-blue/20" />
              <div className="h-10 w-full rounded bg-slate-200 dark:bg-midnight-line" />
              <div className="h-5 w-full rounded bg-slate-100 dark:bg-midnight-line/50" />
              <div className="h-5 w-11/12 rounded bg-slate-100 dark:bg-midnight-line/50" />
            </div>
            <div className="aspect-video rounded-2xl bg-slate-100 dark:bg-midnight-line" />
          </div>
        </div>
      </section>

      {/* Mission skeleton — with image */}
      <section className="bg-[#f0ebe3] dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="h-5 w-96 rounded bg-slate-300 dark:bg-midnight-line" />
              <div className="h-14 sm:h-16 w-[80%] rounded bg-slate-300 dark:bg-midnight-line" />
              <div className="mt-6 space-y-3">
                <div className="h-5 w-full rounded bg-slate-200 dark:bg-midnight-line/50" />
                <div className="h-5 w-11/12 rounded bg-slate-200 dark:bg-midnight-line/50" />
              </div>
            </div>
            <div className="aspect-[4/3] rounded-2xl bg-slate-200 dark:bg-midnight-line" />
          </div>
        </div>
      </section>

      {/* Vision skeleton — with image */}
      <section className="bg-[#f0ebe3] dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 aspect-[4/3] rounded-2xl bg-slate-200 dark:bg-midnight-line" />
            <div className="order-1 lg:order-2 space-y-4">
              <div className="h-5 w-72 rounded bg-slate-300 dark:bg-midnight-line" />
              <div className="h-14 sm:h-16 w-[70%] rounded bg-slate-300 dark:bg-midnight-line" />
              <div className="mt-6 space-y-3">
                <div className="h-5 w-full rounded bg-slate-200 dark:bg-midnight-line/50" />
                <div className="h-5 w-10/12 rounded bg-slate-200 dark:bg-midnight-line/50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values skeleton — image cards */}
      <section className="py-24 bg-[#f0ebe3] dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-midnight-surface rounded-2xl overflow-hidden">
                <div className="aspect-[4/3] bg-slate-200 dark:bg-midnight-line" />
                <div className="p-6 space-y-3">
                  <div className="h-6 w-28 rounded bg-slate-200 dark:bg-midnight-line" />
                  <div className="h-4 w-full rounded bg-slate-100 dark:bg-midnight-line/50" />
                  <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-midnight-line/50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History carousel skeleton */}
      <section className="py-24 bg-[#f8f9fa] dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-3 mb-12">
            <div className="h-6 w-28 rounded-full bg-geely-blue/10" />
            <div className="h-10 w-48 rounded bg-slate-200 dark:bg-midnight-line" />
            <div className="h-5 w-96 rounded bg-slate-100 dark:bg-midnight-line/50" />
          </div>
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[320px] sm:w-[400px]">
                <div className="aspect-[16/10] rounded-2xl bg-slate-200 dark:bg-midnight-line mb-4" />
                <div className="h-3 w-16 rounded bg-geely-blue/20 mb-1" />
                <div className="h-5 w-48 rounded bg-slate-200 dark:bg-midnight-line mb-1" />
                <div className="h-4 w-full rounded bg-slate-100 dark:bg-midnight-line/50" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA skeleton */}
      <section className="py-24 bg-white dark:bg-midnight-surface">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#0a1628] via-[#101d35] to-[#194bff] rounded-3xl p-16 text-center space-y-4">
            <div className="h-10 w-64 mx-auto rounded bg-white/10" />
            <div className="h-5 w-96 mx-auto rounded bg-white/5" />
            <div className="flex gap-4 justify-center pt-4">
              <div className="h-12 w-36 rounded-full bg-white/10" />
              <div className="h-12 w-40 rounded-full bg-white/5" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
