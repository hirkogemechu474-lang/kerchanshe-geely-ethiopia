import { FileText, Clock, Send, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { prisma } from '@/lib/prisma';



export default async function QuotationStats() {
  const stats = await getQuotationStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
        <p className="text-sm text-gray-500 mt-1">Total Quotes</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
          <Clock className="w-6 h-6 text-yellow-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{stats.pending}</h3>
        <p className="text-sm text-gray-500 mt-1">Pending</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
          <Send className="w-6 h-6 text-purple-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{stats.sent}</h3>
        <p className="text-sm text-gray-500 mt-1">Sent</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{stats.won}</h3>
        <p className="text-sm text-gray-500 mt-1">Won</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
          <XCircle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{stats.lost}</h3>
        <p className="text-sm text-gray-500 mt-1">Lost</p>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold">{stats.totalValue}</h3>
        <p className="text-sm text-blue-100 mt-1">Total Value</p>
      </div>
    </div>
  );
}

async function getQuotationStats() {
  try {
    const quotations = await prisma.quotation.findMany();
    
    const total = quotations.length;
    const pending = quotations.filter(q => q.status === 'new' || q.status === 'in_progress').length;
    const sent = quotations.filter(q => q.status === 'sent' || q.status === 'follow_up').length;
    const won = quotations.filter(q => q.status === 'won').length;
    const lost = quotations.filter(q => q.status === 'lost').length;
    
    const totalValue = 0;
    const formattedValue = new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(totalValue);

    return {
      total,
      pending,
      sent,
      won,
      lost,
      totalValue: formattedValue,
    };
  } catch (error) {
    console.error('Error fetching quotation stats:', error);
    return {
      total: 0,
      pending: 0,
      sent: 0,
      won: 0,
      lost: 0,
      totalValue: 'ETB 0',
    };
  }
}
