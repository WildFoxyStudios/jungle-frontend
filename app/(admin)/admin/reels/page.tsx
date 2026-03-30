'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
import { truncate, formatDate } from '@/lib/utils';

interface Reel {
  id: string;
  user_id?: string;
  author?: { username: string } | string;
  username?: string;
  caption?: string;
  duration?: number;
  views_count?: number;
  view_count?: number;
  likes_count?: number;
  like_count?: number;
  video_url?: string;
  created_at: string;
  [key: string]: unknown;
}

function getAuthor(reel: Reel): string {
  if (typeof reel.author === 'object' && reel.author !== null) {
    return (reel.author as { username: string }).username ?? '—';
  }
  if (typeof reel.author === 'string') return reel.author;
  return reel.username ?? '—';
}

function getViews(reel: Reel): number {
  return reel.views_count ?? reel.view_count ?? 0;
}

function getLikes(reel: Reel): number {
  return reel.likes_count ?? reel.like_count ?? 0;
}

export default function ReelsPage() {
  const { toast } = useToast();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Reel | null>(null);
  const [viewTarget, setViewTarget] = useState<Reel | null>(null);

  useEffect(() => {
    async function fetchReels() {
      try {
        const res = await adminApi.get<Reel[] | { reels?: Reel[]; data?: Reel[] }>(
          '/api/reels/feed',
          { params: { limit: 1000 } },
        );
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (raw.reels ?? raw.data ?? []);
        setReels(list);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load reels';
        toast(message, 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchReels();
  }, [toast]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await adminApi.delete(`/api/reels/${deleteTarget.id}`);
      setReels((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast('Reel deleted successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast(message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (row: Reel) => (
        <span className="font-mono text-xs text-gray-400">{truncate(row.id, 8)}</span>
      ),
    },
    {
      key: 'author',
      header: 'Author',
      sortable: true,
      render: (row: Reel) => (
        <span className="text-white">{getAuthor(row)}</span>
      ),
    },
    {
      key: 'caption',
      header: 'Caption',
      render: (row: Reel) => (
        <span className="text-gray-300 text-xs">{truncate(row.caption ?? '', 50)}</span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration (s)',
      sortable: true,
      render: (row: Reel) => (
        <span className="text-gray-400">{row.duration ?? '—'}</span>
      ),
    },
    {
      key: 'views_count',
      header: 'Views',
      sortable: true,
      render: (row: Reel) => (
        <span className="text-gray-400">{getViews(row).toLocaleString()}</span>
      ),
    },
    {
      key: 'likes_count',
      header: 'Likes',
      sortable: true,
      render: (row: Reel) => (
        <span className="text-gray-400">{getLikes(row).toLocaleString()}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (row: Reel) => (
        <span className="text-gray-400 text-xs">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Reel) => (
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="ghost" onClick={() => setViewTarget(row)}>
            View
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Reels</h1>

      <DataTable
        data={reels}
        columns={columns}
        loading={loading}
        pageSize={25}
        searchKeys={['caption', 'username'] as (keyof Reel)[]}
      />

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        danger
        title="Delete Reel"
        description={`Are you sure you want to delete reel ${deleteTarget?.id ? truncate(deleteTarget.id, 8) : ''}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* View Reel modal */}
      {viewTarget && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setViewTarget(null)}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">View Reel</h2>
              <button
                onClick={() => setViewTarget(null)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close reel modal"
              >
                <X size={20} />
              </button>
            </div>

            {viewTarget.video_url ? (
              <video
                src={viewTarget.video_url}
                controls
                className="w-full rounded-lg bg-black max-h-96"
              />
            ) : (
              <div className="w-full h-48 rounded-lg bg-gray-700 flex items-center justify-center text-gray-500 text-sm">
                No video available
              </div>
            )}

            <div className="mt-4 space-y-3">
              {viewTarget.caption && (
                <p className="text-gray-300 text-sm">{viewTarget.caption}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-700 rounded p-3">
                  <p className="text-gray-400 text-xs mb-1">Author</p>
                  <p className="text-white">{getAuthor(viewTarget)}</p>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <p className="text-gray-400 text-xs mb-1">Duration</p>
                  <p className="text-white">{viewTarget.duration != null ? `${viewTarget.duration}s` : '—'}</p>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <p className="text-gray-400 text-xs mb-1">Views</p>
                  <p className="text-white">{getViews(viewTarget).toLocaleString()}</p>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <p className="text-gray-400 text-xs mb-1">Likes</p>
                  <p className="text-white">{getLikes(viewTarget).toLocaleString()}</p>
                </div>
                <div className="bg-gray-700 rounded p-3 col-span-2">
                  <p className="text-gray-400 text-xs mb-1">Created At</p>
                  <p className="text-white">{formatDate(viewTarget.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
