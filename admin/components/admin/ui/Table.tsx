import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/** Wraps a <table> in the standard card chrome (border, rounded, overflow). */
export function TableCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cx('bg-white rounded-xl border border-gray-200 overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-50 text-gray-500 uppercase text-xs">{children}</thead>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cx('hover:bg-gray-50/60 transition-colors', className)} {...props} />;
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cx('text-left px-4 py-3 font-semibold', className)} {...props} />;
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cx('px-4 py-3 text-gray-700', className)} {...props} />;
}
