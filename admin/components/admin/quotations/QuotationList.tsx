'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Edit, Download, Send } from 'lucide-react';

export default function QuotationList() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await fetch('/api/admin/quotations');
      const data = await response.json();
      setQuotations(data.quotations || []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      sent: 'bg-purple-100 text-purple-700',
      follow_up: 'bg-orange-100 text-orange-700',
      won: 'bg-green-100 text-green-700',
      lost: 'bg-red-100 text-red-700',
    };
    return styles[status as keyof typeof styles] || styles.new;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading quotations...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quotations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No quotations found
                </td>
              </tr>
            ) : (
              quotations.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{quote.quoteNumber}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{quote.customerName}</div>
                    <div className="text-sm text-gray-500">{quote.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {quote.vehicleId || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(Number(quote.finalAmount || quote.amount))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(quote.status)}`}>
                      {(quote.status || 'new').replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/admin/quotations/${quote.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" 
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link 
                        href={`/admin/quotations/${quote.id}/edit`}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" 
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Send">
                        <Send className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Download PDF">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
