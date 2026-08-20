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
        tone === 'highlight'
          ? 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${tone === 'highlight' ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`} />}
      </div>
      <div className={`text-2xl font-bold mt-1.5 ${tone === 'highlight' ? 'text-orange-700 dark:text-orange-300' : 'text-gray-900 dark:text-gray-100'}`}>
        {value}
      </div>
    </div>
  );
}
