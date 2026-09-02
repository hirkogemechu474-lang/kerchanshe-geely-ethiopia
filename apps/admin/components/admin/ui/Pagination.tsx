import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

/** Standard Prev/Next pager for list screens, used both for server-paginated
 * API responses (page/total drive the query) and for client-side slicing of
 * an already-fetched, capped array — either way the caller just tracks
 * `page` state and passes a new value back through `onPageChange`. */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap px-1">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium text-gray-700 dark:text-gray-300">{start}–{end}</span> of{' '}
        <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </Button>
        <span className="text-xs text-gray-500 dark:text-gray-400">Page {page} of {pageCount}</span>
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
          Next <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
