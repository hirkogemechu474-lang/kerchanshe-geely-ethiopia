import { LucideIcon } from 'lucide-react';

/** Standard KPI/stat card used at the top of list & dashboard pages.
 *  Pass `onClick` to make it double as a status-filter control (e.g. an
 *  "orders" or "quotations" list where clicking a tile filters the table
 *  below); `active` highlights it as the current filter. Renders as a
 *  plain (non-interactive) card when `onClick` is omitted. */
export function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'default',
  onClick,
  active = false,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: 'default' | 'highlight';
  onClick?: () => void;
  active?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-xl border p-4 text-left w-full transition-colors ${
        active
          ? 'border-geely-blue bg-blue-50 dark:bg-blue-900/20 ring-1 ring-geely-blue'
          : tone === 'highlight'
          ? 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      } ${onClick && !active ? 'hover:border-geely-blue/50 hover:shadow-sm cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${active ? 'text-geely-blue' : tone === 'highlight' ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`} />}
      </div>
      <div className={`text-2xl font-bold mt-1.5 ${active ? 'text-geely-blue' : tone === 'highlight' ? 'text-orange-700 dark:text-orange-300' : 'text-gray-900 dark:text-gray-100'}`}>
        {value}
      </div>
    </Tag>
  );
}
