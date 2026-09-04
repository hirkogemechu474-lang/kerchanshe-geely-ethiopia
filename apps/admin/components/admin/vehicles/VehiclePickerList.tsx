'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow } from '@/components/admin/ui';

interface PickerVehicle {
  id: string;
  name: string;
  model: string;
  year: number;
  heroImageUrl: string | null;
  images: unknown;
}

/**
 * Shared "pick a vehicle" list used by pages that manage a per-vehicle child
 * resource (Gallery & Videos, Vehicle Sections, Colors, Models & Variants).
 * Each row either navigates via `hrefFor` (e.g. straight into a wizard step)
 * or fires `onSelect` (e.g. to filter an inline CRUD table on the same page).
 */
export default function VehiclePickerList({
  hrefFor,
  onSelect,
  selectedId,
}: {
  hrefFor?: (vehicleId: string) => string;
  onSelect?: (vehicleId: string) => void;
  selectedId?: string;
}) {
  const [vehicles, setVehicles] = useState<PickerVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/vehicles?limit=200&page=1');
        if (res.ok) {
          const data = await res.json();
          setVehicles(data.vehicles || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) => v.name.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)
    );
  }, [vehicles, search]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vehicles..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-geely-blue focus:border-transparent"
        />
      </div>
      <TableCard>
        <THead>
          <tr>
            <Th>Vehicle</Th>
            <Th>Model</Th>
            <Th>Year</Th>
            <Th className="text-right">Action</Th>
          </tr>
        </THead>
        <TBody>
          {loading ? (
            <EmptyTableRow colSpan={4} message="Loading vehicles..." />
          ) : filtered.length === 0 ? (
            <EmptyTableRow colSpan={4} message="No vehicles found" />
          ) : (
            filtered.map((vehicle) => {
              const thumb =
                vehicle.heroImageUrl ||
                (Array.isArray(vehicle.images) ? (vehicle.images[0] as string) : null);
              const active = selectedId === vehicle.id;
              return (
                <Tr key={vehicle.id} className={active ? 'bg-blue-50 dark:bg-blue-900/20' : undefined}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                        {thumb ? (
                          <img src={thumb} alt={vehicle.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">IMG</div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{vehicle.name}</span>
                    </div>
                  </Td>
                  <Td className="text-gray-500 dark:text-gray-400">{vehicle.model}</Td>
                  <Td className="text-gray-500 dark:text-gray-400">{vehicle.year}</Td>
                  <Td className="text-right">
                    {hrefFor ? (
                      <Link href={hrefFor(vehicle.id)} className="text-geely-blue dark:text-blue-400 hover:underline font-medium">
                        Manage
                      </Link>
                    ) : (
                      <button
                        onClick={() => onSelect?.(vehicle.id)}
                        className="text-geely-blue dark:text-blue-400 hover:underline font-medium"
                      >
                        {active ? 'Selected' : 'Select'}
                      </button>
                    )}
                  </Td>
                </Tr>
              );
            })
          )}
        </TBody>
      </TableCard>
    </div>
  );
}
