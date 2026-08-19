import Link from 'next/link';
import { TrendingUp, Eye } from 'lucide-react';

interface VehicleModel {
  id: string;
  name: string;
  sales: number;
  views: number;
  trend: number;
  image: string;
}

export default async function TopModels() {
  // Fetch real data from API
  const topModels = await getTopModels();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Models</h3>
          <p className="text-sm text-gray-500 mt-1">Best sellers this month</p>
        </div>
        <Link
          href="/admin/analytics/vehicles"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {topModels.map((model, index) => (
          <div
            key={model.id}
            className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex-shrink-0">
              {index + 1}
            </div>
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0">
              {/* Placeholder for vehicle image */}
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                IMG
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900">{model.name}</h4>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-500">{model.sales} sales</span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Eye className="w-3.5 h-3.5" />
                  {model.views}
                </span>
              </div>
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                model.trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp className={`w-4 h-4 ${model.trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(model.trend)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function getTopModels(): Promise<VehicleModel[]> {
  // Mock data - replace with actual API call
  return [
    {
      id: '1',
      name: 'Coolray',
      sales: 45,
      views: 1234,
      trend: 18,
      image: '/vehicles/coolray.jpg',
    },
    {
      id: '2',
      name: 'Azkarra',
      sales: 38,
      views: 987,
      trend: 12,
      image: '/vehicles/azkarra.jpg',
    },
    {
      id: '3',
      name: 'Emgrand X7',
      sales: 32,
      views: 876,
      trend: 8,
      image: '/vehicles/emgrand-x7.jpg',
    },
    {
      id: '4',
      name: 'Monjaro',
      sales: 28,
      views: 765,
      trend: -3,
      image: '/vehicles/monjaro.jpg',
    },
    {
      id: '5',
      name: 'Okavango',
      sales: 24,
      views: 654,
      trend: 5,
      image: '/vehicles/okavango.jpg',
    },
  ];
}
