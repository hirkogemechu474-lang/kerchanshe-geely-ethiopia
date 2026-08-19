import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { Plus, Car, FolderTree, Settings, LayoutGrid, ListChecks, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import VehicleManagementClient from '@/components/admin/vehicles/VehicleManagementClient';
import { PageHeader, LinkButton, Card, StatTile } from '@/components/admin/ui';

export default async function VehiclesPage() {
  await requirePermission('canViewVehicles');

  const [totalVehicles, inStock, lowStock, outOfStock, totalCategories] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { stock: { gt: 5 } } }),
    prisma.vehicle.count({ where: { stock: { gt: 0, lte: 5 } } }),
    prisma.vehicle.count({ where: { stock: 0 } }),
    prisma.vehicleCategory.count(),
  ]);

  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true, name: true, slug: true, model: true, year: true,
      category: true, basePrice: true, finalPrice: true, hidePrice: true, stock: true,
      status: true, heroImageUrl: true, images: true, sku: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const stats = { total: totalVehicles, inStock, lowStock, outOfStock };

  const tabs = [
    {
      name: 'All Vehicles',
      href: '/admin/vehicles',
      icon: Car,
      count: stats.total,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      active: true,
    },
    {
      name: 'Categories',
      href: '/admin/categories',
      icon: FolderTree,
      count: totalCategories,
      color: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      active: false,
    },
    {
      name: 'Vehicle Settings',
      href: '/admin/vehicles/settings',
      icon: Settings,
      color: 'from-violet-500 to-violet-600',
      textColor: 'text-violet-600',
      bgColor: 'bg-violet-50',
      active: false,
    },
  ];

  const statCards = [
    {
      label: 'Total Vehicles',
      value: stats.total,
      icon: LayoutGrid,
      sub: 'In your catalog',
      gradient: 'from-blue-500 to-blue-600',
      ring: 'shadow-blue-500/20',
      valueColor: 'text-gray-900',
    },
    {
      label: 'In Stock',
      value: stats.inStock,
      icon: CheckCircle2,
      sub: `Stock > 5 units`,
      gradient: 'from-emerald-500 to-emerald-600',
      ring: 'shadow-emerald-500/20',
      valueColor: 'text-emerald-600',
    },
    {
      label: 'Low Stock',
      value: stats.lowStock,
      icon: AlertTriangle,
      sub: `Stock 1–5 units — reorder soon`,
      gradient: 'from-amber-500 to-amber-600',
      ring: 'shadow-amber-500/20',
      valueColor: 'text-amber-600',
    },
    {
      label: 'Out of Stock',
      value: stats.outOfStock,
      icon: XCircle,
      sub: `Stock = 0 — update inventory`,
      gradient: 'from-rose-500 to-rose-600',
      ring: 'shadow-rose-500/20',
      valueColor: 'text-rose-600',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Management"
        description="Add, edit, and organize your vehicle inventory"
        actions={
          <LinkButton href="/admin/vehicles/new">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add New Vehicle</span>
            <span className="sm:hidden">Add Vehicle</span>
          </LinkButton>
        }
      />

      {/* Section Tabs */}
      <Card padding="none" className="p-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  tab.active
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-md shadow-black/5 ring-1 ring-black/5`
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  tab.active ? 'bg-white/20' : `${tab.bgColor} ${tab.textColor}`
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm sm:text-base ${tab.active ? 'text-white' : 'text-gray-900 group-hover:text-gray-900'}`}>
                    {tab.name}
                  </div>
                  <div className={`text-xs ${tab.active ? 'text-blue-100' : 'text-gray-500'}`}>
                    {tab.count !== undefined
                      ? `${tab.count} ${tab.count === 1 ? 'item' : 'items'}`
                      : 'Feature & warranty defaults'}
                  </div>
                </div>
                {tab.active && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-white rounded-t-full opacity-80 sm:hidden" />
                )}
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      {/* Client Component for Search, Filters, and List */}
      <Card padding="none">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Vehicle Inventory</h2>
          </div>
          <div className="text-xs text-gray-500">
            Showing first <span className="font-semibold text-gray-700">{vehicles.length}</span> of <span className="font-semibold text-gray-700">{stats.total}</span>
          </div>
        </div>
        <VehicleManagementClient initialVehicles={vehicles} totalCount={stats.total} />
      </Card>
    </div>
  );
}
