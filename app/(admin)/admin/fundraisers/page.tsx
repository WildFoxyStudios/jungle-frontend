'use client';

import { useEffect, useState, useCallback } from 'react';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import Badge from '@/components/admin/Badge';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
import { truncate, formatDate } from '@/lib/utils';

interface Fundraiser {
  id: string;
  title: string;
  creator?: string;
  user?: { username: string };
  goal_amount: number;
  raised_amount: number;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

function getCreator(f: Fundraiser): string {
  if (f.creator) return f.creator;
  if (f.user?.username) return f.user.username;
  return '—';
}

function getProgress(f: Fundraiser): number {
  if (!f.goal_amount || f.goal_amount <= 0) return 0;
  return Math.min(100, (f.raised_amount / f.goal_amount) * 100);
}

export default function FundraisersPage() {
  const { toast } = useToast();
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Fundraiser | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchFundraisers = useCallback(async () => {
    try {
      const res = await adminApi.get<Fundraiser[] | { fundraisers?: Fundraiser[]; data?: Fundraiser[] }>(
        '/api/fundraisers',
      );
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw.fundraisers ?? raw.data ?? []);
      setFundraisers(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load fundraisers';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFundraisers();
  }, [fetchFundraisers]);

  async function handleCancelConfirm() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await adminApi.delete(`/api/fundraisers/${cancelTarget.id}`);
      setFundraisers((prev) =>
        prev.map((f) => (f.id === cancelTarget.id ? { ...f, status: 'cancelled' } : f)),
      );
      toast('Fundraiser cancelled successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to cancel fundraiser';
      toast(message, 'error');
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (row: Fundraiser) => (
        <span className="font-mono text-xs text-gray-400">{truncate(row.id, 8)}</span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (row: Fundraiser) => (
        <span className="text-white">{truncate(row.title ?? '', 40)}</span>
      ),
    },
    {
      key: 'creator',
      header: 'Creator',
      sortable: true,
      render: (row: Fundraiser) => (
        <span className="text-gray-300">{getCreator(row)}</span>
      ),
    },
    {
      key: 'goal_amount',
      header: 'Goal',
      sortable: true,
      render: (row: Fundraiser) => (
        <span className="text-gray-300">${Number(row.goal_amount).toLocaleString()}</span>
      ),
    },
    {
      key: 'raised_amount',
      header: 'Raised',
      sortable: true,
      render: (row: Fundraiser) => (
        <span className="text-gray-300">${Number(row.raised_amount).toLocaleString()}</span>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (row: Fundraiser) => {
        const pct = getProgress(row);
        return (
          <div className="flex items-center gap-2 min-w-[100px]">
            <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-10 text-right">{pct.toFixed(0)}%</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: Fundraiser) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (row: Fundraiser) => (
        <span className="text-gray-400 text-xs">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Fundraiser) => (
        <Button
          size="sm"
          variant="danger"
          disabled={row.status === 'cancelled'}
          onClick={() => setCancelTarget(row)}
        >
          Cancel
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Fundraisers</h1>

      <DataTable
        data={fundraisers}
        columns={columns}
        loading={loading}
        pageSize={25}
        searchKeys={['title', 'creator'] as (keyof Fundraiser)[]}
      />

      <Modal
        open={!!cancelTarget}
        danger
        title="Cancel Fundraiser"
        description={`Are you sure you want to cancel "${cancelTarget?.title ? truncate(cancelTarget.title, 40) : ''}" by ${cancelTarget ? getCreator(cancelTarget) : ''}? This action cannot be undone.`}
        onConfirm={handleCancelConfirm}
        onCancel={() => !cancelling && setCancelTarget(null)}
      />
    </div>
  );
}
