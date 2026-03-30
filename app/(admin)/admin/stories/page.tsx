'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
import { truncate, formatDate } from '@/lib/utils';

interface Story {
  id: string;
  user_id?: string;
  author?: { username: string } | string;
  username?: string;
  user?: { username: string };
  media_type?: string;
  visibility?: string;
  views_count?: number;
  view_count?: number;
  expires_at?: string;
  created_at: string;
  [key: string]: unknown;
}

function getAuthor(story: Story): string {
  if (typeof story.author === 'object' && story.author !== null) {
    return (story.author as { username: string }).username ?? '—';
  }
  if (typeof story.author === 'string') return story.author;
  if (story.user && typeof story.user === 'object') {
    return (story.user as { username: string }).username ?? '—';
  }
  return story.username ?? '—';
}

function getViews(story: Story): number {
  return story.views_count ?? story.view_count ?? 0;
}

export default function StoriesPage() {
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null);

  useEffect(() => {
    async function fetchStories() {
      try {
        const res = await adminApi.get<Story[] | { stories?: Story[]; data?: Story[] }>(
          '/api/stories',
          { params: { limit: 1000 } },
        );
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (raw.stories ?? raw.data ?? []);
        setStories(list);
      } catch {
        try {
          const res = await adminApi.get<Story[] | { stories?: Story[]; data?: Story[] }>(
            '/api/admin/stories',
            { params: { limit: 1000 } },
          );
          const raw = res.data;
          const list = Array.isArray(raw) ? raw : (raw.stories ?? raw.data ?? []);
          setStories(list);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to load stories';
          toast(message, 'error');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchStories();
  }, [toast]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await adminApi.delete(`/api/stories/${deleteTarget.id}`);
      setStories((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast('Story deleted successfully', 'success');
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
      render: (row: Story) => (
        <span className="font-mono text-xs text-gray-400">{truncate(row.id, 8)}</span>
      ),
    },
    {
      key: 'author',
      header: 'Author',
      sortable: true,
      render: (row: Story) => (
        <span className="text-white">{getAuthor(row)}</span>
      ),
    },
    {
      key: 'media_type',
      header: 'Media Type',
      render: (row: Story) => (
        <Badge variant={row.media_type ?? 'unknown'}>
          {row.media_type ?? '—'}
        </Badge>
      ),
    },
    {
      key: 'visibility',
      header: 'Visibility',
      sortable: true,
      render: (row: Story) => (
        <span className="text-gray-300 capitalize">{row.visibility ?? '—'}</span>
      ),
    },
    {
      key: 'views_count',
      header: 'Views',
      sortable: true,
      render: (row: Story) => (
        <span className="text-gray-400">{getViews(row).toLocaleString()}</span>
      ),
    },
    {
      key: 'expires_at',
      header: 'Expires At',
      sortable: true,
      render: (row: Story) => (
        <span className="text-gray-400 text-xs">
          {row.expires_at ? formatDate(row.expires_at) : '—'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (row: Story) => (
        <span className="text-gray-400 text-xs">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Story) => (
        <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Stories</h1>

      <DataTable
        data={stories}
        columns={columns}
        loading={loading}
        pageSize={25}
        searchKeys={['username'] as (keyof Story)[]}
      />

      <Modal
        open={!!deleteTarget}
        danger
        title="Delete Story"
        description={`Are you sure you want to delete story ${deleteTarget?.id ? truncate(deleteTarget.id, 8) : ''}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
