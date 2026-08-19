'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Plus, MapPin, Zap } from 'lucide-react';

interface ChargingStation {
  id: string;
  name: string;
  city: string;
  stationType: string;
  chargerCount: number;
  maxPower: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const STATION_TYPE_LABELS: Record<string, string> = {
  'fast-dc': 'Fast DC',
  'level-2': 'Level 2',
  'home': 'Home',
};

const STATION_TYPE_COLORS: Record<string, string> = {
  'fast-dc': 'bg-red-100 text-red-800',
  'level-2': 'bg-blue-100 text-blue-800',
  'home': 'bg-green-100 text-green-800',
};

export default function ChargingStationList() {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await fetch('/api/admin/electric/stations');
      const data = await response.json();
      setStations(data.stations || []);
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this charging station?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/electric/stations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setStations(stations.filter(s => s.id !== id));
      } else {
        alert('Failed to delete station');
      }
    } catch (error) {
      console.error('Error deleting station:', error);
      alert('Failed to delete station');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/electric/stations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setStations(stations.map(s =>
          s.id === id ? { ...s, isActive: !currentStatus } : s
        ));
      }
    } catch (error) {
      console.error('Error updating station:', error);
    }
  };

  const filteredStations = filter === 'all'
    ? stations
    : stations.filter(s => (filter === 'active' ? s.isActive : !s.isActive));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading charging stations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({stations.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Active ({stations.filter(s => s.isActive).length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              filter === 'inactive'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Inactive ({stations.filter(s => !s.isActive).length})
          </button>
        </div>
        <Link
          href="/admin/electric/stations/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Station
        </Link>
      </div>

      {filteredStations.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-gray-200">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No charging stations</h3>
          <p className="text-sm text-gray-600 mb-4">Start by adding your first charging station</p>
          <Link
            href="/admin/electric/stations/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Station
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Station Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chargers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Power</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStations.map((station) => (
                <tr key={station.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{station.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{station.city}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATION_TYPE_COLORS[station.stationType]}`}>
                      {STATION_TYPE_LABELS[station.stationType]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{station.chargerCount}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{station.maxPower}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleToggleActive(station.id, station.isActive)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        station.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {station.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/electric/stations/${station.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(station.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
