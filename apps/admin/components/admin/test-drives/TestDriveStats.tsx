import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { StatTile } from '@/components/admin/ui';

export default function TestDriveStats({ stats }: { stats: { total: number; pending: number; confirmed: number; completed: number } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatTile label="Total This Month" value={stats.total} icon={Calendar} />
      <StatTile label="Pending Confirmation" value={stats.pending} icon={Clock} />
      <StatTile label="Confirmed" value={stats.confirmed} icon={CheckCircle} />
      <StatTile label="Completed" value={stats.completed} icon={CheckCircle} />
    </div>
  );
}
