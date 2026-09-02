export default function SpotlightStrip() {
  return (
    <div className="bg-ice dark:bg-midnight border-b border-line dark:border-midnight-line transition-colors">
      <div className="page-container flex items-center gap-6 h-16 text-[13px] text-navy dark:text-ice font-semibold">
        <div className="w-2 h-2 rounded-full bg-active-blue"></div>
        <div>360° Model Spotlight — scrub to rotate the new Geely Monjaro</div>
      </div>
    </div>
  );
}
