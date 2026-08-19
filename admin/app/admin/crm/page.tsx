import { requirePermission } from '@/lib/auth/middleware';
import { RefreshCw, Database, Link as LinkIcon, CheckCircle, AlertCircle } from 'lucide-react';

export default async function CRMPage() {
  await requirePermission('canManageIntegrations');

  const integrations = [
    { id: 'zoho', name: 'Zoho CRM', status: 'connected', lastSync: '2024-12-14 10:30', recordsSynced: 1245 },
    { id: 'salesforce', name: 'Salesforce', status: 'disconnected', lastSync: null, recordsSynced: 0 },
    { id: 'hubspot', name: 'HubSpot', status: 'disconnected', lastSync: null, recordsSynced: 0 },
  ];

  const syncLogs = [
    { timestamp: '2024-12-14 10:30', type: 'success', message: 'Successfully synced 45 contacts to Zoho CRM' },
    { timestamp: '2024-12-14 09:15', type: 'success', message: 'Successfully synced 12 leads to Zoho CRM' },
    { timestamp: '2024-12-14 08:00', type: 'error', message: 'Failed to sync opportunities - API rate limit exceeded' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM Integration</h1>
          <p className="mt-1 text-sm text-gray-500">Connect and sync with external CRM systems</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <RefreshCw className="w-5 h-5" />
          Sync Now
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-10 h-10 text-blue-600" />
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                integration.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {integration.status.toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{integration.name}</h3>
            {integration.status === 'connected' ? (
              <>
                <div className="text-sm text-gray-500 mb-1">
                  Last sync: {integration.lastSync}
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  Records synced: {integration.recordsSynced}
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    Configure
                  </button>
                  <button className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                    Disconnect
                  </button>
                </div>
              </>
            ) : (
              <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Connect
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sync Frequency
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option>Every 15 minutes</option>
              <option>Every 30 minutes</option>
              <option>Every hour</option>
              <option>Every 6 hours</option>
              <option>Daily</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Direction
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option>Bidirectional</option>
              <option>To CRM only</option>
              <option>From CRM only</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Sync Objects</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm text-gray-700">Contacts</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm text-gray-700">Leads</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm text-gray-700">Opportunities</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-gray-700">Accounts</span>
            </label>
          </div>
        </div>

        <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save Configuration
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Activity Log</h3>
        <div className="space-y-3">
          {syncLogs.map((log, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {log.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="text-sm text-gray-900">{log.message}</div>
                <div className="text-xs text-gray-500 mt-1">{log.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
