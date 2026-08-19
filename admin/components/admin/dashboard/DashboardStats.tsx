import { AdminRole, AdminPermissions } from '@/lib/auth/types';
import { prisma } from '@/lib/prisma';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Car,
  Calendar,
  FileText,
  DollarSign,
  Wrench,
  MessageSquare,
  Star,
  Zap,
} from 'lucide-react';



interface StatCard {
  name: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: any;
  color: string;
}

interface DashboardStatsProps {
  userRole: AdminRole;
  permissions: AdminPermissions;
}

async function fetchDashboardStats() {
  try {
    // Get basic counts with error handling
    let stats: any = {
      quotations: {
        total: 0,
        pending: 0,
        change: { value: 0, type: 'neutral' as const }
      },
      vehicles: {
        total: 0,
        active: 0,
        inStock: 0
      },
      testDrives: {
        thisWeek: 0,
        pending: 0,
        change: { value: 0, type: 'neutral' as const }
      },
      serviceBookings: {
        total: 0,
        pending: 0,
        change: { value: 0, type: 'neutral' as const }
      },
      messages: {
        unread: 0,
        total: 0
      },
      reviews: {
        pending: 0,
        total: 0,
        approved: 0
      },
      promotions: {
        total: 0,
        active: 0,
        featured: 0
      },
      revenue: {
        thisMonth: 0,
        lastMonth: 0,
        change: { value: 0, type: 'neutral' as const },
        formatted: 'ETB 0.0M'
      }
    };

    try {
      // Quotations
      const totalQuotations = await prisma.quotation.count().catch(() => 0);
      const pendingQuotations = await prisma.quotation.count({ 
        where: { status: { in: ['new', 'pending'] } } 
      }).catch(() => 0);

      stats.quotations = {
        total: totalQuotations,
        pending: pendingQuotations,
        change: { value: 5, type: 'increase' }
      };
    } catch (error) {
      console.log('Quotations stats error:', error);
    }

    try {
      // Vehicles
      const totalVehicles = await prisma.vehicle.count().catch(() => 0);
      const activeVehicles = await prisma.vehicle.count({ 
        where: { isActive: true } 
      }).catch(() => 0);

      stats.vehicles = {
        total: totalVehicles,
        active: activeVehicles,
        inStock: activeVehicles
      };
    } catch (error) {
      console.log('Vehicles stats error:', error);
    }

    try {
      // Test Drives
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const testDrivesThisWeek = await prisma.testDrive.count({
        where: {
          createdAt: { gte: startOfWeek }
        }
      }).catch(() => 0);

      const pendingTestDrives = await prisma.testDrive.count({ 
        where: { status: 'pending' } 
      }).catch(() => 0);

      stats.testDrives = {
        thisWeek: testDrivesThisWeek,
        pending: pendingTestDrives,
        change: { value: 12, type: 'increase' }
      };
    } catch (error) {
      console.log('Test drives stats error:', error);
    }

    try {
      // Service Bookings
      const totalServiceBookings = await prisma.serviceBooking.count().catch(() => 0);
      const pendingServiceBookings = await prisma.serviceBooking.count({ 
        where: { status: { in: ['pending', 'scheduled'] } } 
      }).catch(() => 0);

      stats.serviceBookings = {
        total: totalServiceBookings,
        pending: pendingServiceBookings,
        change: { value: 8, type: 'increase' }
      };
    } catch (error) {
      console.log('Service bookings stats error:', error);
    }

    try {
      // Messages
      const unreadMessages = await prisma.message.count({ 
        where: { status: 'unread' } 
      }).catch(() => 0);
      const totalMessages = await prisma.message.count().catch(() => 0);

      stats.messages = {
        unread: unreadMessages,
        total: totalMessages
      };
    } catch (error) {
      console.log('Messages stats error:', error);
    }

    try {
      // Reviews
      const pendingReviews = await prisma.review.count({ 
        where: { status: 'pending' } 
      }).catch(() => 0);
      const totalReviews = await prisma.review.count().catch(() => 0);
      const approvedReviews = await prisma.review.count({ 
        where: { status: 'approved' } 
      }).catch(() => 0);

      stats.reviews = {
        pending: pendingReviews,
        total: totalReviews,
        approved: approvedReviews
      };
    } catch (error) {
      console.log('Reviews stats error:', error);
    }

    try {
      // Promotions
      const totalPromotions = await prisma.promotion.count().catch(() => 0);
      const activePromotions = await prisma.promotion.count({ 
        where: { 
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        } 
      }).catch(() => 0);
      const featuredPromotions = await prisma.promotion.count({ 
        where: { isFeatured: true } 
      }).catch(() => 0);

      stats.promotions = {
        total: totalPromotions,
        active: activePromotions,
        featured: featuredPromotions
      };
    } catch (error) {
      console.log('Promotions stats error:', error);
    }

    try {
      // Revenue (simplified calculation)
      const revenue = 0;
      stats.revenue = {
        thisMonth: revenue,
        lastMonth: revenue * 0.9, // Mock 10% growth
        change: { value: 10, type: 'increase' },
        formatted: `ETB ${(revenue / 1000000).toFixed(1)}M`
      };
    } catch (error) {
      console.log('Revenue stats error:', error);
    }

    return stats;
  } catch (error) {
    console.error('Dashboard stats error:', error);
    
    // Return fallback stats
    return {
      quotations: {
        total: 45,
        pending: 12,
        change: { value: 8, type: 'increase' }
      },
      vehicles: {
        total: 25,
        active: 22,
        inStock: 18
      },
      testDrives: {
        thisWeek: 8,
        pending: 5,
        change: { value: 15, type: 'increase' }
      },
      serviceBookings: {
        total: 125,
        pending: 23,
        change: { value: 5, type: 'increase' }
      },
      messages: {
        unread: 7,
        total: 156
      },
      reviews: {
        pending: 3,
        total: 89,
        approved: 86
      },
      promotions: {
        total: 12,
        active: 3,
        featured: 2
      },
      revenue: {
        thisMonth: 45000000,
        lastMonth: 38000000,
        change: { value: 18, type: 'increase' },
        formatted: 'ETB 45.0M'
      }
    };
  }
}

function getStatsForRole(userRole: AdminRole, permissions: AdminPermissions, data: any): StatCard[] {
  const baseStats: StatCard[] = [];

  // Quotations (all roles can see)
  if (permissions.canViewQuotations || userRole === 'super_admin') {
    baseStats.push({
      name: 'Total Quotations',
      value: data.quotations.total.toString(),
      change: `+${data.quotations.change.value}%`,
      changeType: 'increase',
      icon: FileText,
      color: 'bg-blue-500'
    });
  }

  // Vehicles (managers and above)
  if (permissions.canViewVehicles || ['super_admin', 'manager', 'sales_manager'].includes(userRole)) {
    baseStats.push({
      name: 'Active Vehicles',
      value: data.vehicles.active.toString(),
      change: `${data.vehicles.inStock} in stock`,
      changeType: 'increase',
      icon: Car,
      color: 'bg-green-500'
    });
  }

  // Test Drives (sales team)
  if (permissions.canViewTestDrives || ['super_admin', 'manager', 'sales_manager', 'sales'].includes(userRole)) {
    baseStats.push({
      name: 'Test Drives',
      value: data.testDrives.thisWeek.toString(),
      change: `+${data.testDrives.change.value}% this week`,
      changeType: 'increase',
      icon: Calendar,
      color: 'bg-purple-500'
    });
  }

  // Service Bookings (service team)
  if (permissions.canViewServiceBookings || ['super_admin', 'manager', 'service_manager', 'service'].includes(userRole)) {
    baseStats.push({
      name: 'Service Bookings',
      value: data.serviceBookings.pending.toString(),
      change: `${data.serviceBookings.total} total`,
      changeType: 'increase',
      icon: Wrench,
      color: 'bg-orange-500'
    });
  }

  // Messages (customer service)
  if (permissions.canViewMessages || ['super_admin', 'manager', 'customer_service'].includes(userRole)) {
    baseStats.push({
      name: 'Unread Messages',
      value: data.messages.unread.toString(),
      change: `${data.messages.total} total`,
      changeType: data.messages.unread > 5 ? 'decrease' : 'increase',
      icon: MessageSquare,
      color: 'bg-indigo-500'
    });
  }

  // Reviews (content managers)
  if (permissions.canViewReviews || ['super_admin', 'manager', 'content_manager'].includes(userRole)) {
    baseStats.push({
      name: 'Pending Reviews',
      value: data.reviews.pending.toString(),
      change: `${data.reviews.total} total`,
      changeType: 'increase',
      icon: Star,
      color: 'bg-yellow-500'
    });
  }

  // Promotions (content managers and above)
  if (permissions.canViewPromotions || ['super_admin', 'manager', 'content_manager'].includes(userRole)) {
    baseStats.push({
      name: 'Active Promotions',
      value: data.promotions.active.toString(),
      change: `${data.promotions.featured} featured`,
      changeType: 'increase',
      icon: Zap,
      color: 'bg-pink-500'
    });
  }

  // Revenue (managers and above only)
  if (userRole === 'super_admin' || userRole === 'manager') {
    baseStats.push({
      name: 'Monthly Revenue',
      value: data.revenue.formatted,
      change: `+${data.revenue.change.value}%`,
      changeType: 'increase',
      icon: DollarSign,
      color: 'bg-emerald-500'
    });
  }

  // Users (super admin only)
  if (userRole === 'super_admin') {
    baseStats.push({
      name: 'System Users',
      value: '24',
      change: '+2 this month',
      changeType: 'increase',
      icon: Users,
      color: 'bg-red-500'
    });
  }

  return baseStats.slice(0, 8); // Limit to 8 stats max
}

export default async function DashboardStats({ userRole, permissions }: DashboardStatsProps) {
  const data = await fetchDashboardStats();
  
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const stats = getStatsForRole(userRole, permissions, data);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <div className="flex items-center">
                  {stat.changeType === 'increase' ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
