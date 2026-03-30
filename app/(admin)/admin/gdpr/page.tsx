'use client';

import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import KpiCard from '@/components/admin/KpiCard';
import DataTable from '@/components/admin/DataTable';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
import { truncate, formatDate } from '@/lib/utils';

interface AdminStats {
  pending_gdpr_exports?: number;
  [key: string]: unknown;
}

interface GdprExport {
  id: string;
  user_id: string;
  status: string;
  requested_at: string;
  [key: string]: unknown;
}

export default function GdprPage() {
  const { toast } = useToast();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [exports, setExports] = useState<GdprExport[]>([]);
  const [exportsLoading, setExportsLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await adminApi.get<AdminStats>('/api/admin/stats');
        setPendingCount(res.data.pending_gdpr_exports ?? 0);
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
    async function fetchExports() {
      try {
        const res = await adminApi.get<GdprExport[] | { exports?: GdprExport[]; data?: GdprExport[] }>(
          '/api/admin/gdpr-exports',
        );
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (raw.exports ?? raw.data ?? []);
        setExports(list);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load GDPR exports';
        toast(message, 'error');
      } finally {
        setExportsLoading(false);
      }
    }
    fetchExports();
  }, [toast]);

  async function handleTriggerExport(row: GdprExport) {
    setTriggeringId(row.id);
    try {
      await adminApi.post(`/api/admin/gdpr-exports/${row.id}/trigger`);
      setExports((prev) =>
        prev.map((e) => (e.id === row.id ? { ...e, status: 'processing' } : e)),
      );
      setPendingCount((c) => Math.max(0, c - 1));
      toast(`Export for user ${row.user_id} triggered successfully`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to trigger export';
      toast(message, 'error');
    } finally {
      setTriggeringId(null);
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'Request ID',
      sortable: true,
      render: (row: GdprExport) => (
        <span className="font-mono text-xs text-gray-400">{truncate(row.id, 8)}</span>
      ),
    },
    {
      key: 'user_id',
      header: 'User ID',
      sortable: true,
      render: (row: GdprExport) => (
        <span className="font-mono text-xs text-gray-400">{truncate(row.user_id, 8)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: GdprExport) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      key: 'requested_at',
      header: 'Requested At',
      sortable: true,
      render: (row: GdprExport) => (
        <span className="text-gray-400 text-xs">{formatDate(row.requested_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: GdprExport) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleTriggerExport(row)}
          disabled={triggeringId === row.id || row.status === 'processing' || row.status === 'completed'}
        >
          {triggeringId === row.id ? 'Triggering…' : 'Trigger Export'}
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">GDPR Data Exports</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Pending Exports"
          value={pendingCount}
          icon={<Lock size={20} />}
          loading={statsLoading}
        />
      </div>

      <DataTable
        data={exports}
        columns={columns}
        loading={exportsLoading}
        pageSize={25}
      />
    </div>
  );
}
