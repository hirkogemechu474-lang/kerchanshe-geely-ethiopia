import apiClient from '@/lib/apiClient';

export interface DateRange {
  from: string;
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
    const { data } = await apiClient.get(`/admin/analytics/summary${params}`);
    return data;
  },

  async getVehicleViews(vehicleId?: string): Promise<{ vehicleId: string; views: number }[]> {
    const params = vehicleId ? `?vehicleId=${vehicleId}` : '';
    const { data } = await apiClient.get(`/admin/analytics/vehicle-views${params}`);
    return data;
  },
};
