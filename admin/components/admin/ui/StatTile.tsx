import { LucideIcon } from 'lucide-react';

/** Standard KPI/stat card used at the top of list & dashboard pages. */
export function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: 'default' | 'highlight';
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        tone === 'highlight' ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${tone === 'highlight' ? 'text-orange-500' : 'text-gray-400'}`} />}
      </div>
      <div className={`text-2xl font-bold mt-1.5 ${tone === 'highlight' ? 'text-orange-700' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  );
}
