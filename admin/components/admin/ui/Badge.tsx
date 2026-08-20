export type Tone = 'gray' | 'blue' | 'green' | 'orange' | 'red' | 'purple';

const TONE_CLASSES: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

/**
 * Best-effort tone for a free-text status string (e.g. from a `status: String`
 * Prisma field with no shared enum). Pass an explicit `tone` to <Badge> for
 * anything with a real enum instead of relying on this heuristic.
 */
export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (/(cancel|reject|fail|expired|out_of_service|no_show|overdue|error)/.test(s)) return 'red';
  if (/(complet|approv|active|confirm|convert|paid|publish|pass|resolv|deliver|success|free)/.test(s)) return 'green';
  if (/(await|quote|contact|review|warn|low_stock|pending_approval)/.test(s)) return 'orange';
  if (/(progress|occupied|review|processing)/.test(s)) return 'blue';
  if (/(qc|quality)/.test(s)) return 'purple';
  return 'blue';
}

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}

/** Convenience wrapper: derives the tone from the status text itself. */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <Badge tone={statusTone(status)}>
      {label ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </Badge>
  );
}
