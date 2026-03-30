'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
import { truncate, formatDate } from '@/lib/utils';

interface Post {
  id: string;
  user_id?: string;
  author?: { username: string };
  content?: string;
  body?: string;
  media?: string[];
  created_at: string;
  is_pinned?: boolean;
  status?: string;
  [key: string]: unknown;
}

export default function PostsPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [mediaTarget, setMediaTarget] = useState<Post | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await adminApi.get<Post[] | { posts?: Post[]; data?: Post[] }>('/api/posts/feed', {
          params: { limit: 100 },
        });
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (raw.posts ?? raw.data ?? []);
        setPosts(list);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load posts';
        toast(message, 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [toast]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await adminApi.delete(`/api/admin/posts/${deleteTarget.id}`);
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast('Post deleted by administrator', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast(message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handlePin(post: Post) {
    try {
      await adminApi.post(`/api/posts/${post.id}/pin`);
      toast('Post pinned successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Pin failed';
      toast(message, 'error');
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (row: Post) => (
        <span className="font-mono text-xs text-gray-400">{truncate(row.id, 8)}</span>
      ),
    },
    {
      key: 'author',
      header: 'Author',
      sortable: true,
      render: (row: Post) => (
        <span className="text-white">{row.author?.username ?? '—'}</span>
      ),
    },
    {
      key: 'content',
      header: 'Content',
      render: (row: Post) => {
        const text = row.content ?? row.body ?? '';
        return <span className="text-gray-300 text-xs">{truncate(text, 50)}</span>;
      },
    },
    {
      key: 'media',
      header: 'Media',
      render: (row: Post) => (
        <span className="text-gray-400">{row.media?.length ?? 0}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (row: Post) => (
        <span className="text-gray-400 text-xs">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Post) => {
        const status = row.status ?? (row.is_pinned ? 'pinned' : 'active');
        return <Badge variant={status}>{status}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Post) => (
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
            Delete
          </Button>
          <Button size="sm" variant="outline" onClick={() => handlePin(row)}>
            Pin
          </Button>
          {(row.media?.length ?? 0) > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setMediaTarget(row)}>
              Media
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Posts</h1>

      <DataTable
        data={posts}
        columns={columns}
        loading={loading}
        pageSize={25}
        searchKeys={['content', 'body'] as (keyof Post)[]}
      />

      <Modal
        open={!!deleteTarget}
        danger
        title="Delete Post"
        description={`Are you sure you want to delete post ${deleteTarget?.id ? truncate(deleteTarget.id, 8) : ''}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Media viewer modal */}
      {mediaTarget && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setMediaTarget(null)}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Post Media</h2>
              <button
                onClick={() => setMediaTarget(null)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close media modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(mediaTarget.media ?? []).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Media ${i + 1}`}
                  className="w-full rounded-lg object-cover max-h-48"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
