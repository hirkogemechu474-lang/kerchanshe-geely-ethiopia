'use client';

export default function LeadsFunnel() {
  const stages = [
    { name: 'New Leads', count: 245, percentage: 100, color: 'bg-blue-500' },
    { name: 'Contacted', count: 187, percentage: 76, color: 'bg-indigo-500' },
    { name: 'Qualified', count: 134, percentage: 55, color: 'bg-purple-500' },
    { name: 'Test Drive', count: 89, percentage: 36, color: 'bg-pink-500' },
    { name: 'Quotation Sent', count: 67, percentage: 27, color: 'bg-orange-500' },
    { name: 'Negotiation', count: 45, percentage: 18, color: 'bg-yellow-500' },
    { name: 'Closed Won', count: 28, percentage: 11, color: 'bg-green-500' },
  ];

  const conversionRate = ((stages[stages.length - 1].count / stages[0].count) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Sales Funnel</h3>
        <p className="text-sm text-gray-500 mt-1">Lead conversion pipeline</p>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{stage.name}</span>
              <span className="text-sm font-semibold text-gray-900">{stage.count}</span>
            </div>
            <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className={`h-full ${stage.color} flex items-center justify-end px-3 transition-all duration-500`}
                style={{ width: `${stage.percentage}%` }}
              >
                <span className="text-xs font-semibold text-white">{stage.percentage}%</span>
              </div>
            </div>
            {index < stages.length - 1 && (
              <div className="flex justify-center my-1">
                <div className="text-xs text-gray-400">↓</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Overall Conversion Rate</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                style={{ width: `${conversionRate}%` }}
              />
            </div>
            <span className="text-lg font-bold text-gray-900">{conversionRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
