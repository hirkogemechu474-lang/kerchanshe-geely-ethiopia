'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarEvent {
  id: string;
  customerName: string;
  vehicleModel: string;
  time: string;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
}

export default function TestDriveCalendar({ events: inputEvents }: { events: CalendarEvent[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const events = inputEvents.reduce<Record<string, CalendarEvent[]>>((grouped, event) => {
    const key = event.date.slice(0, 10);
    (grouped[key] ||= []).push(event);
    return grouped;
  }, {});

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getEventsForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = formatDateKey(date);
    return events[dateKey] || [];
  };

  const getStatusColor = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
    }
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{monthName}</h2>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Calendar Days */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayEvents = getEventsForDate(day);
          const isToday =
            currentDate.getMonth() === new Date().getMonth() &&
            currentDate.getFullYear() === new Date().getFullYear() &&
            day === new Date().getDate();

          return (
            <div
              key={day}
              className={`aspect-square border border-gray-200 rounded-lg p-2 hover:shadow-md transition-all cursor-pointer ${
                isToday ? 'bg-blue-50 border-blue-600' : 'bg-white'
              }`}
              onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {day}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs px-1.5 py-0.5 rounded truncate ${getStatusColor(event.status)}`}
                    title={`${event.time} - ${event.customerName} (${event.vehicleModel})`}
                  >
                    {event.time}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 px-1.5">+{dayEvents.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          {(() => {
            const dateKey = formatDateKey(selectedDate);
            const dayEvents = events[dateKey] || [];
            
            if (dayEvents.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No test drives scheduled for this day</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{event.customerName}</div>
                      <div className="text-sm text-gray-500">{event.vehicleModel}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{event.time}</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-sm text-gray-600">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-600">Completed</span>
        </div>
      </div>
    </div>
  );
}
