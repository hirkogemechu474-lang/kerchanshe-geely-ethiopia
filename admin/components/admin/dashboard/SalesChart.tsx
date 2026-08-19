'use client';

import { useState } from 'react';
import { TrendingUp } from 'lucide-react';

export default function SalesChart() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Mock data - replace with real data from API
  const data = {
    week: [
      { day: 'Mon', sales: 12 },
      { day: 'Tue', sales: 19 },
      { day: 'Wed', sales: 15 },
      { day: 'Thu', sales: 22 },
      { day: 'Fri', sales: 28 },
      { day: 'Sat', sales: 35 },
      { day: 'Sun', sales: 18 },
    ],
    month: [
      { day: 'Week 1', sales: 45 },
      { day: 'Week 2', sales: 52 },
      { day: 'Week 3', sales: 61 },
      { day: 'Week 4', sales: 58 },
    ],
    year: [
      { day: 'Jan', sales: 145 },
      { day: 'Feb', sales: 132 },
      { day: 'Mar', sales: 178 },
      { day: 'Apr', sales: 165 },
      { day: 'May', sales: 189 },
      { day: 'Jun', sales: 201 },
      { day: 'Jul', sales: 195 },
      { day: 'Aug', sales: 223 },
      { day: 'Sep', sales: 210 },
      { day: 'Oct', sales: 198 },
      { day: 'Nov', sales: 234 },
      { day: 'Dec', sales: 256 },
    ],
  };

  const currentData = data[period];
  const maxValue = Math.max(...currentData.map((d) => d.sales));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
          <p className="text-sm text-gray-500 mt-1">Vehicle sales performance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              period === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              period === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              period === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 h-48">
        {currentData.map((item, index) => {
          const height = (item.sales / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center h-40">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg hover:from-blue-700 hover:to-blue-500 transition-all cursor-pointer relative group"
                  style={{ height: `${height}%` }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.sales}
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-500 font-medium">{item.day}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">+18.2%</span>
          <span className="text-gray-500">vs last {period}</span>
        </div>
        <span className="text-gray-500">
          Total:{' '}
          <span className="font-semibold text-gray-900">
            {currentData.reduce((sum, item) => sum + item.sales, 0)} vehicles
          </span>
        </span>
      </div>
    </div>
  );
}
