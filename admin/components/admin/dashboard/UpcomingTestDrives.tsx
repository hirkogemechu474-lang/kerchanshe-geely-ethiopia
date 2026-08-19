import Link from 'next/link';
import { Calendar, Clock, User, Car, MapPin } from 'lucide-react';

interface TestDrive {
  id: string;
  customerName: string;
  vehicleModel: string;
  date: string;
  time: string;
  location: string;
  status: 'confirmed' | 'pending' | 'completed';
}

export default async function UpcomingTestDrives() {
  const testDrives = await getUpcomingTestDrives();

  const getStatusColor = (status: TestDrive['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Test Drives</h3>
          <p className="text-sm text-gray-500 mt-1">Next 7 days</p>
        </div>
        <Link
          href="/admin/test-drives"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {testDrives.map((drive) => (
          <div
            key={drive.id}
            className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-900">{drive.customerName}</span>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(drive.status)}`}
              >
                {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Car className="w-4 h-4" />
                <span>{drive.vehicleModel}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{drive.date}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{drive.time}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{drive.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {testDrives.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No upcoming test drives scheduled</p>
        </div>
      )}
    </div>
  );
}

async function getUpcomingTestDrives(): Promise<TestDrive[]> {
  // Mock data - replace with actual API call
  return [
    {
      id: '1',
      customerName: 'Abebe Kebede',
      vehicleModel: 'Coolray',
      date: 'Tomorrow',
      time: '10:00 AM',
      location: 'Sarbet Showroom',
      status: 'confirmed',
    },
    {
      id: '2',
      customerName: 'Sara Tesfaye',
      vehicleModel: 'Azkarra',
      date: 'Dec 15',
      time: '2:30 PM',
      location: 'Bole Showroom',
      status: 'confirmed',
    },
    {
      id: '3',
      customerName: 'Dawit Haile',
      vehicleModel: 'Emgrand X7',
      date: 'Dec 16',
      time: '11:00 AM',
      location: 'Sarbet Showroom',
      status: 'pending',
    },
    {
      id: '4',
      customerName: 'Meron Assefa',
      vehicleModel: 'Monjaro',
      date: 'Dec 17',
      time: '3:00 PM',
      location: 'Bahir Dar',
      status: 'confirmed',
    },
    {
      id: '5',
      customerName: 'Yohannes Girma',
      vehicleModel: 'Okavango',
      date: 'Dec 18',
      time: '9:30 AM',
      location: 'Sarbet Showroom',
      status: 'pending',
    },
  ];
}
