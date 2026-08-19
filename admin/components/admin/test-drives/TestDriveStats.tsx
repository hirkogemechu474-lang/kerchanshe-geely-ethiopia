import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function TestDriveStats({ stats }: { stats: { total: number; pending: number; confirmed: number; completed: number } }) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-green-600">Live</span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
          <p className="text-sm text-gray-500 mt-1">Total This Month</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <span className="text-sm font-medium text-yellow-600">{stats.pending}</span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.pending}</h3>
          <p className="text-sm text-gray-500 mt-1">Pending Confirmation</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <span className="text-sm font-medium text-green-600">{stats.confirmed}</span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.confirmed}</h3>
          <p className="text-sm text-gray-500 mt-1">Confirmed</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-purple-600" />
          </div>
          <span className="text-sm font-medium text-purple-600">{stats.completed}</span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.completed}</h3>
          <p className="text-sm text-gray-500 mt-1">Completed</p>
        </div>
      </div>
    </div>
  );
}
