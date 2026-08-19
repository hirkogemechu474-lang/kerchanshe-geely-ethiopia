import { AdminRole } from '@/lib/auth/types';
import {
  User,
  Car,
  Calendar,
  FileText,
  MessageSquare,
  Star,
  Wrench,
  Package,
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'lead' | 'vehicle' | 'test_drive' | 'quotation' | 'message' | 'review' | 'service' | 'part';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

interface RecentActivityProps {
  userRole: AdminRole;
}

export default async function RecentActivity({ userRole }: RecentActivityProps) {
  // Fetch real activity data from API
  const activities = await getRecentActivities(userRole);

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'lead':
        return User;
      case 'vehicle':
        return Car;
      case 'test_drive':
        return Calendar;
      case 'quotation':
        return FileText;
      case 'message':
        return MessageSquare;
      case 'review':
        return Star;
      case 'service':
        return Wrench;
      case 'part':
        return Package;
      default:
        return User;
    }
  };

  const getIconColor = (type: Activity['type']) => {
    switch (type) {
      case 'lead':
        return 'bg-blue-100 text-blue-600';
      case 'vehicle':
        return 'bg-green-100 text-green-600';
      case 'test_drive':
        return 'bg-orange-100 text-orange-600';
      case 'quotation':
        return 'bg-purple-100 text-purple-600';
      case 'message':
        return 'bg-pink-100 text-pink-600';
      case 'review':
        return 'bg-yellow-100 text-yellow-600';
      case 'service':
        return 'bg-cyan-100 text-cyan-600';
      case 'part':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = getIcon(activity.type);
          const iconColor = getIconColor(activity.type);

          return (
            <div key={activity.id} className="flex gap-3">
              <div className={`w-10 h-10 rounded-lg ${iconColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>
      <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
        View All Activity
      </button>
    </div>
  );
}

async function getRecentActivities(role: AdminRole): Promise<Activity[]> {
  // Mock data - replace with actual API call
  const mockActivities: Activity[] = [
    {
      id: '1',
      type: 'lead',
      title: 'New lead created',
      description: 'Abebe Kebede interested in Azkarra',
      timestamp: '5 minutes ago',
      user: 'Sales Team',
    },
    {
      id: '2',
      type: 'test_drive',
      title: 'Test drive scheduled',
      description: 'Coolray - Tomorrow at 10:00 AM',
      timestamp: '15 minutes ago',
      user: 'John Doe',
    },
    {
      id: '3',
      type: 'quotation',
      title: 'Quotation sent',
      description: 'Emgrand X7 - ETB 2,450,000',
      timestamp: '1 hour ago',
      user: 'Sales Team',
    },
    {
      id: '4',
      type: 'message',
      title: 'New customer message',
      description: 'Inquiry about financing options',
      timestamp: '2 hours ago',
    },
    {
      id: '5',
      type: 'service',
      title: 'Service completed',
      description: 'Annual maintenance - Vehicle #1234',
      timestamp: '3 hours ago',
      user: 'Service Team',
    },
    {
      id: '6',
      type: 'review',
      title: 'New review received',
      description: '5 stars for Coolray',
      timestamp: '4 hours ago',
    },
    {
      id: '7',
      type: 'vehicle',
      title: 'Vehicle added',
      description: 'New Monjaro to inventory',
      timestamp: '5 hours ago',
      user: 'Admin',
    },
    {
      id: '8',
      type: 'part',
      title: 'Parts restocked',
      description: 'Brake pads - 20 units',
      timestamp: '6 hours ago',
      user: 'Inventory',
    },
  ];

  // Filter based on role permissions
  return mockActivities;
}
