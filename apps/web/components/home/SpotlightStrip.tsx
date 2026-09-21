interface SpotlightStripProps {
  // Real vehicle name driving the interactive showcase directly below this
  // strip (see ShowcaseSection/app/page.tsx) — never a hardcoded model name,
  // and omitted entirely when there's nothing to spotlight yet.
  vehicleName?: string | null;
}

export default function SpotlightStrip({ vehicleName }: SpotlightStripProps) {
  return (
    <div className="bg-ice dark:bg-midnight border-b border-line dark:border-midnight-line transition-colors">
      <div className="page-container flex items-center gap-6 h-16 text-[13px] text-navy dark:text-ice font-semibold">
        <div className="w-2 h-2 rounded-full bg-active-blue"></div>
        <div>
          {vehicleName
            // Vehicle.name already includes the "Geely" brand prefix (e.g.
            // "Geely EX2") — don't prepend it again.
            ? `360° Model Spotlight: scrub to rotate the new ${vehicleName}`
            : '360° Model Spotlight: explore our Geely models from every angle'}
        </div>
      </div>
    </div>
  );
}
