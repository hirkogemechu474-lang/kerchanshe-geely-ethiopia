/**
 * Analytics service for the admin dashboard.
 */

export interface DateRange {
  from: string; // ISO date string
  to: string;
}

export interface AnalyticsSummary {
  totalPageViews: number;
  uniqueVisitors: number;
  testDriveRequests: number;
  quoteRequests: number;
  conversionRate: number;
}

export const analyticsService = {
  async getSummary(range?: DateRange): Promise<AnalyticsSummary> {
    const params = range ? `?from=${range.from}&to=${range.to}` : '';
    const res = await fetch(`/api/admin/analytics/summary${params}`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json() as Promise<AnalyticsSummary>;
  },

  async getVehicleViews(vehicleId?: string): Promise<{ vehicleId: string; views: number }[]> {
    const params = vehicleId ? `?vehicleId=${vehicleId}` : '';
    const res = await fetch(`/api/admin/analytics/vehicle-views${params}`);
    if (!res.ok) throw new Error('Failed to fetch vehicle views');
    return res.json();
  },
};
