'use client';

import { useState, useEffect } from 'react';
import { User, Car, DollarSign, Calendar, ChevronRight } from 'lucide-react';

interface Quote {
  id: string;
  customerName: string;
  vehicleModel: string;
  amount: number;
  date: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
}

export default function QuotationPipeline() {
  const [quotes, setQuotes] = useState<{
    new: Quote[];
    in_progress: Quote[];
    sent: Quote[];
    follow_up: Quote[];
    won: Quote[];
    lost: Quote[];
  }>({
    new: [],
    in_progress: [],
    sent: [],
    follow_up: [],
    won: [],
    lost: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await fetch('/api/admin/quotations');
      const data = await response.json();
      
      if (data.quotations) {
        const grouped = data.quotations.reduce((acc: any, q: any) => {
          const status = q.status || 'new';
          if (!acc[status]) acc[status] = [];
          
          acc[status].push({
            id: q.id,
            customerName: q.customerName,
            vehicleModel: q.vehicleId || 'Vehicle',
            amount: Number(q.finalAmount || q.amount),
            date: formatDate(q.createdAt),
            priority: q.priority || 'medium',
            status: q.status,
          });
          
          return acc;
        }, {});
        
        setQuotes({
          new: grouped.new || [],
          in_progress: grouped.in_progress || [],
          sent: grouped.sent || [],
          follow_up: grouped.follow_up || [],
          won: grouped.won || [],
          lost: grouped.lost || [],
        });
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const stages = [
    { key: 'new', label: 'New', color: 'bg-blue-100 border-blue-200' },
    { key: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 border-yellow-200' },
    { key: 'sent', label: 'Sent', color: 'bg-purple-100 border-purple-200' },
    { key: 'follow_up', label: 'Follow Up', color: 'bg-orange-100 border-orange-200' },
    { key: 'won', label: 'Won', color: 'bg-green-100 border-green-200' },
    { key: 'lost', label: 'Lost', color: 'bg-red-100 border-red-200' },
  ];

  const getPriorityColor = (priority: Quote['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
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
    <div className="overflow-x-auto pb-4">
      <div className="inline-flex gap-4 min-w-full">
        {stages.map((stage) => (
          <div key={stage.key} className="flex-1 min-w-[300px]">
            <div className={`rounded-lg border-2 ${stage.color} p-4 mb-4`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                <span className="px-2 py-1 bg-white rounded-full text-sm font-medium">
                  {quotes[stage.key as keyof typeof quotes].length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {quotes[stage.key as keyof typeof quotes].map((quote) => (
                <div
                  key={quote.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{quote.customerName}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(quote.priority)}`} />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Car className="w-3.5 h-3.5" />
                      <span>{quote.vehicleModel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-900 font-semibold">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{formatCurrency(quote.amount)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{quote.date}</span>
                    </div>
                  </div>

                  <button className="w-full mt-3 flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {quotes[stage.key as keyof typeof quotes].length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No quotes in this stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
