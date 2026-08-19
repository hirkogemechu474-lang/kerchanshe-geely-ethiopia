import Link from 'next/link';
import { FileText, User, Car, DollarSign, Clock } from 'lucide-react';

interface Quotation {
  id: string;
  customerName: string;
  vehicleModel: string;
  amount: string;
  status: 'new' | 'in_progress' | 'sent' | 'follow_up';
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
}

export default async function PendingQuotations() {
  const quotations = await getPendingQuotations();

  const getStatusColor = (status: Quotation['status']) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'sent':
        return 'bg-green-100 text-green-700';
      case 'follow_up':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityIndicator = (priority: Quotation['priority']) => {
    switch (priority) {
      case 'high':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      case 'medium':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'low':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pending Quotations</h3>
          <p className="text-sm text-gray-500 mt-1">Requires attention</p>
        </div>
        <Link
          href="/admin/quotations"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {quotations.map((quotation) => (
          <div
            key={quotation.id}
            className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getPriorityIndicator(quotation.priority)}
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-900">{quotation.customerName}</span>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quotation.status)}`}
              >
                {quotation.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Car className="w-4 h-4" />
                <span>{quotation.vehicleModel}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span className="font-semibold">{quotation.amount}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 col-span-2">
                <Clock className="w-4 h-4" />
                <span>{quotation.createdAt}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
              <button className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                View Details
              </button>
              <button className="flex-1 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                Send Quote
              </button>
            </div>
          </div>
        ))}
      </div>

      {quotations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No pending quotations</p>
        </div>
      )}
    </div>
  );
}

async function getPendingQuotations(): Promise<Quotation[]> {
  // Mock data - replace with actual API call
  return [
    {
      id: '1',
      customerName: 'Tsion Alemayehu',
      vehicleModel: 'Azkarra',
      amount: 'ETB 2,450,000',
      status: 'new',
      createdAt: '2 hours ago',
      priority: 'high',
    },
    {
      id: '2',
      customerName: 'Biniam Tadesse',
      vehicleModel: 'Coolray',
      amount: 'ETB 1,850,000',
      status: 'in_progress',
      createdAt: '5 hours ago',
      priority: 'medium',
    },
    {
      id: '3',
      customerName: 'Helen Negash',
      vehicleModel: 'Emgrand X7',
      amount: 'ETB 2,150,000',
      status: 'sent',
      createdAt: '1 day ago',
      priority: 'low',
    },
    {
      id: '4',
      customerName: 'Michael Bekele',
      vehicleModel: 'Monjaro',
      amount: 'ETB 3,200,000',
      status: 'follow_up',
      createdAt: '2 days ago',
      priority: 'high',
    },
    {
      id: '5',
      customerName: 'Rahel Worku',
      vehicleModel: 'Okavango',
      amount: 'ETB 2,650,000',
      status: 'in_progress',
      createdAt: '3 days ago',
      priority: 'medium',
    },
  ];
}
