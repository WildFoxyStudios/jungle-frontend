'use client';

import { useEffect, useState, useCallback } from 'react';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import Badge from '@/components/admin/Badge';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
import { truncate, formatDate } from '@/lib/utils';

interface Stream {
  id: string;
  streamer_name?: string;
  user?: { username: string; avatar_url?: string };
  title: string;
  status: string;
  viewers_count?: number;
  viewer_count?: number;
  started_at: string;
  [key: string]: unknown;
}

function getStreamerName(stream: Stream): string {
  if (stream.streamer_name) return stream.streamer_name;
  if (stream.user?.username) return stream.user.username;
  return '—';
}

function getViewers(stream: Stream): number {
  return stream.viewers_count ?? stream.viewer_count ?? 0;
}

export default function StreamsPage() {
  const { toast } = useToast();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [endTarget, setEndTarget] = useState<Stream | null>(null);
  const [ending, setEnding] = useState(false);

  const fetchStreams = useCallback(async () => {
    try {
      const res = await adminApi.get<Stream[] | { streams?: Stream[]; data?: Stream[] }>(
        '/api/streams/live',
      );
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw.streams ?? raw.data ?? []);
      setStreams(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load streams';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStreams();
    const interval = setInterval(fetchStreams, 30_000);
    return () => clearInterval(interval);
  }, [fetchStreams]);

  async function handleEndConfirm() {
    if (!endTarget) return;
    setEnding(true);
    try {
      await adminApi.post(`/api/streams/${endTarget.id}/end`);
      setStreams((prev) =>
        prev.map((s) => (s.id === endTarget.id ? { ...s, status: 'ended' } : s)),
      );
      toast('Stream ended successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to end stream';
      toast(message, 'error');
    } finally {
      setEnding(false);
      setEndTarget(null);
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (row: Stream) => (
        <span className="font-mono text-xs text-gray-400">{truncate(row.id, 8)}</span>
      ),
    },
    {
      key: 'streamer_name',
      header: 'Streamer',
      sortable: true,
      render: (row: Stream) => (
        <div className="flex items-center gap-2">
          {row.user?.avatar_url && (
            <img
              src={row.user.avatar_url}
              alt={getStreamerName(row)}
              className="w-7 h-7 rounded-full object-cover bg-gray-700"
            />
          )}
          <span className="text-white">{getStreamerName(row)}</span>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (row: Stream) => (
        <span className="text-gray-300 text-xs">{truncate(row.title ?? '', 50)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: Stream) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      key: 'viewers_count',
      header: 'Viewers',
      sortable: true,
      render: (row: Stream) => (
        <span className="text-gray-400">{getViewers(row).toLocaleString()}</span>
      ),
    },
    {
      key: 'started_at',
      header: 'Started At',
      sortable: true,
      render: (row: Stream) => (
        <span className="text-gray-400 text-xs">{formatDate(row.started_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Stream) => (
        <Button
          size="sm"
          variant="danger"
          disabled={row.status === 'ended'}
          onClick={() => setEndTarget(row)}
        >
          End Stream
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Live Streams</h1>

      <DataTable
        data={streams}
        columns={columns}
        loading={loading}
        pageSize={25}
        searchKeys={['streamer_name', 'title'] as (keyof Stream)[]}
      />

      <Modal
        open={!!endTarget}
        danger
        title="End Stream"
        description={`Are you sure you want to end the stream "${endTarget?.title ? truncate(endTarget.title, 40) : ''}" by ${endTarget ? getStreamerName(endTarget) : ''}? This action cannot be undone.`}
        onConfirm={handleEndConfirm}
        onCancel={() => !ending && setEndTarget(null)}
      />
    </div>
  );
}
