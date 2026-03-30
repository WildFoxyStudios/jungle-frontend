'use client';

import { useEffect, useState } from 'react';
import { Users, Activity, TrendingUp, FileText, MessageSquare, AlertTriangle } from 'lucide-react';
import KpiCard from '@/components/admin/KpiCard';
import LineChart from '@/components/admin/charts/LineChart';
import BarChart from '@/components/admin/charts/BarChart';
import Skeleton from '@/components/admin/Skeleton';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
interface AdminStats {
  total_users?: number;
  active_users_today?: number;
  active_users_week?: number;
  total_posts?: number;
  total_messages?: number;
  pending_reports?: number;
  pending_gdpr_exports?: number;
  platform_revenue?: string | number;
  [key: string]: unknown;
}

interface HealthStatus {
  status?: string;
  database?: string;
  redis?: string;
  [key: string]: unknown;
}

interface ChartPoint {
  date: string;
  users: number;
  [key: string]: unknown;
}

interface PostChartPoint {
  date: string;
  posts: number;
  [key: string]: unknown;
}

function isHealthy(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return v === 'ok' || v === 'healthy' || v === 'up';
}

function generateMockDailyData(total: number, days = 30): ChartPoint[] {
  const result: ChartPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const base = Math.floor(total / days);
    const variance = Math.floor(base * 0.4);
    result.push({ date: label, users: Math.max(0, base + Math.floor((Math.random() * 2 - 1) * variance)) });
  }
  return result;
}

function generateMockPostData(total: number, days = 30): PostChartPoint[] {
  const result: PostChartPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const base = Math.floor(total / days);
    const variance = Math.floor(base * 0.5);
    result.push({ date: label, posts: Math.max(0, base + Math.floor((Math.random() * 2 - 1) * variance)) });
  }
  return result;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [userChartData, setUserChartData] = useState<ChartPoint[]>([]);
  const [postChartData, setPostChartData] = useState<PostChartPoint[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [statsRes, financeRes] = await Promise.all([
          adminApi.get<AdminStats>('/api/admin/stats'),
          adminApi.get<{ total_platform_revenue: string }>('/api/admin/finances')
        ]);
        
        const data = {
          ...statsRes.data,
          platform_revenue: financeRes.data.total_platform_revenue
        };
        
        setStats(data);
        setUserChartData(generateMockDailyData(data.total_users ?? 1000));
        setPostChartData(generateMockPostData(data.total_posts ?? 5000));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load stats';
        toast(message, 'error');
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, [toast]);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await adminApi.get<HealthStatus>('/api/health');
        setHealth(res.data);
      } catch {
        // silently fail for health widget
      }
    }
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Total Users"
          value={stats?.total_users ?? 0}
          icon={<Users size={20} />}
          loading={statsLoading}
        />
        <KpiCard
          title="DAU"
          value={stats?.active_users_today ?? 0}
          icon={<Activity size={20} />}
          loading={statsLoading}
        />
        <KpiCard
          title="WAU"
          value={stats?.active_users_week ?? 0}
          icon={<TrendingUp size={20} />}
          loading={statsLoading}
        />
        <KpiCard
          title="Total Posts"
          value={stats?.total_posts ?? 0}
          icon={<FileText size={20} />}
          loading={statsLoading}
        />
        <KpiCard
          title="Total Messages"
          value={stats?.total_messages ?? 0}
          icon={<MessageSquare size={20} />}
          loading={statsLoading}
        />
        <KpiCard
          title="Platform Revenue"
          value={stats?.platform_revenue ? `€${Number(stats.platform_revenue).toFixed(2)}` : '€0.00'}
          icon={<TrendingUp size={20} className="text-green-500" />}
          loading={statsLoading}
        />
        <KpiCard
          title="Pending Reports"
          value={stats?.pending_reports ?? 0}
          icon={<AlertTriangle size={20} className="text-red-500" />}
          loading={statsLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* New Users / Day */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-white font-semibold mb-4">New Users / Day (last 30 days)</h2>
          {statsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <LineChart data={userChartData} xKey="date" yKey="users" color="#3b82f6" />
          )}
        </div>

        {/* Posts / Day */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-white font-semibold mb-4">Posts / Day (last 30 days)</h2>
          {statsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <BarChart data={postChartData} xKey="date" yKey="posts" color="#8b5cf6" />
          )}
        </div>
      </div>

      {/* System Health Widget */}
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm">
        <h2 className="text-white font-semibold mb-4">System Health</h2>
        {health === null ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-40" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full flex-shrink-0 ${isHealthy(health.database) ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="text-gray-300 text-sm">
                Database:{' '}
                <span className={isHealthy(health.database) ? 'text-green-400' : 'text-red-400'}>
                  {health.database ?? 'unknown'}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full flex-shrink-0 ${isHealthy(health.redis) ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="text-gray-300 text-sm">
                Redis:{' '}
                <span className={isHealthy(health.redis) ? 'text-green-400' : 'text-red-400'}>
                  {health.redis ?? 'unknown'}
                </span>
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-2">Auto-refreshes every 30s</p>
          </div>
        )}
      </div>
    </div>
  );
}
