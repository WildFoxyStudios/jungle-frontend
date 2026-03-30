'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Image,
  LogOut,
  Brain,
  DollarSign,
  TrendingDown,
  Bell,
  Database,
  Server,
} from 'lucide-react';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import Skeleton from '@/components/admin/Skeleton';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
interface HealthStatus {
  database?: string | boolean;
  redis?: string | boolean;
  [key: string]: unknown;
}

interface MaintenanceTask {
  label: string;
  endpoint: string;
  icon: React.ReactNode;
  description: string;
}

const MAINTENANCE_TASKS: MaintenanceTask[] = [
  {
    label: 'Process Scheduled Posts',
    endpoint: '/api/admin/process-scheduled',
    icon: <Calendar size={18} />,
    description: 'Process all posts that are scheduled and due for publishing.',
  },
  {
    label: 'Cleanup GIF Cache',
    endpoint: '/api/admin/cleanup-gifs',
    icon: <Image size={18} />,
    description: 'Remove stale GIF cache entries to free up storage.',
  },
  {
    label: 'Cleanup Expired Sessions',
    endpoint: '/api/admin/cleanup-sessions',
    icon: <LogOut size={18} />,
    description: 'Delete all expired user sessions from the database.',
  },
  {
    label: 'Generate Daily Memories',
    endpoint: '/api/admin/generate-memories',
    icon: <Brain size={18} />,
    description: 'Generate "On this day" memory notifications for users.',
  },
  {
    label: 'Auto-Complete Fundraisers',
    endpoint: '/api/admin/complete-fundraisers',
    icon: <DollarSign size={18} />,
    description: 'Finalize fundraisers that have reached their end date.',
  },
  {
    label: 'Cleanup Old Trending',
    endpoint: '/api/admin/cleanup-trending',
    icon: <TrendingDown size={18} />,
    description: 'Remove outdated entries from the trending topics list.',
  },
  {
    label: 'Send Stream Reminders',
    endpoint: '/api/admin/send-reminders',
    icon: <Bell size={18} />,
    description: 'Send upcoming stream reminder notifications to followers.',
  },
];

function isHealthy(value: string | boolean | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  const v = value.toLowerCase();
  return v === 'ok' || v === 'healthy' || v === 'up';
}

export default function SystemHealthPage() {
  const { toast } = useToast();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await adminApi.get<HealthStatus>('/api/health');
        setHealth(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch health status';
        toast(message, 'error');
      } finally {
        setHealthLoading(false);
      }
    }

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [toast]);

  async function handleConfirm() {
    if (!selectedTask) return;
    setRunning(true);
    const task = selectedTask;
    setSelectedTask(null);
    try {
      const res = await adminApi.post<{ message?: string }>(task.endpoint);
      const message = res.data?.message ?? `${task.label} completed successfully`;
      toast(message, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `${task.label} failed`;
      toast(message, 'error');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-white">System Health</h1>

      {/* Health Status Card */}
      <div className="bg-gray-800 rounded-lg p-6 max-w-md">
        <h2 className="text-white font-semibold mb-4">Service Status</h2>
        {healthLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-48" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  isHealthy(health?.database) ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <Database size={16} className="text-gray-400" />
              <span className="text-gray-300 text-sm">
                Database:{' '}
                <span
                  className={
                    isHealthy(health?.database) ? 'text-green-400 font-medium' : 'text-red-400 font-medium'
                  }
                >
                  {String(health?.database ?? 'unknown')}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  isHealthy(health?.redis) ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <Server size={16} className="text-gray-400" />
              <span className="text-gray-300 text-sm">
                Redis:{' '}
                <span
                  className={
                    isHealthy(health?.redis) ? 'text-green-400 font-medium' : 'text-red-400 font-medium'
                  }
                >
                  {String(health?.redis ?? 'unknown')}
                </span>
              </span>
            </div>
            <p className="text-gray-500 text-xs pt-1">Auto-refreshes every 30 s</p>
          </div>
        )}
      </div>

      {/* Maintenance Tasks */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-white font-semibold mb-6">Maintenance Tasks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MAINTENANCE_TASKS.map((task) => (
            <button
              key={task.endpoint}
              onClick={() => setSelectedTask(task)}
              disabled={running}
              className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-left rounded-lg p-4 transition-colors"
            >
              <span className="text-blue-400 flex-shrink-0">{task.icon}</span>
              <span className="text-gray-200 text-sm font-medium">{task.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={selectedTask !== null}
        danger
        title={selectedTask?.label ?? ''}
        description={selectedTask?.description ?? ''}
        onConfirm={handleConfirm}
        onCancel={() => setSelectedTask(null)}
      />
    </div>
  );
}
