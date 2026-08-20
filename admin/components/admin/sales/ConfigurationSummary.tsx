// Renders the structured configurator selection captured on a Quotation or
// SalesOrder (FR-102/103) — see web/app/configurator/page.tsx
// (handleSendConfiguration) for the exact shape this was written with:
// { vehicle, trim, color, wheels, interior, accessories: string[], price }.
interface ConfigurationJson {
  vehicle?: string;
  trim?: string;
  color?: string;
  wheels?: string;
  interior?: string;
  accessories?: string[];
  price?: number;
}

export function ConfigurationSummary({ configuration }: { configuration: unknown }) {
  if (!configuration || typeof configuration !== 'object') return null;
  const config = configuration as ConfigurationJson;

  const rows: [string, string][] = [
    ['Vehicle', config.vehicle || ''],
    ['Trim', config.trim || ''],
    ['Color', config.color || ''],
    ['Wheels', config.wheels || ''],
    ['Interior', config.interior || ''],
    ['Accessories', Array.isArray(config.accessories) && config.accessories.length > 0 ? config.accessories.join(', ') : ''],
  ].filter(([, value]) => value) as [string, string][];

  if (rows.length === 0) return null;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">
        Configurator Selection
      </p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-blue-700">{label}</dt>
            <dd className="text-blue-900 font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {typeof config.price === 'number' && (
        <p className="text-sm text-blue-900 font-semibold mt-2 pt-2 border-t border-blue-200">
          Configured price: ETB {config.price.toLocaleString()}
        </p>
      )}
    </div>
  );
}
