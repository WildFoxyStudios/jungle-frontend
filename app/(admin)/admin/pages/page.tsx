'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
import { truncate, formatDate } from '@/lib/utils';

interface Page {
  id: string;
  name: string;
  is_verified?: boolean;
  verified?: boolean;
  followers_count?: number;
  created_at: string;
  [key: string]: unknown;
}

export default function PagesPage() {
  const { toast } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);

  useEffect(() => {
    async function fetchPages() {
      try {
        const res = await adminApi.get<Page[] | { pages?: Page[]; data?: Page[] }>('/api/pages');
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (raw.pages ?? raw.data ?? []);
        setPages(list);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load pages';
        toast(message, 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchPages();
  }, [toast]);

  function isVerified(page: Page): boolean {
    return page.is_verified ?? page.verified ?? false;
  }

  async function handleVerify(page: Page, verified: boolean) {
    try {
      await adminApi.put(`/api/pages/${page.id}`, { verified });
      setPages((prev) =>
        prev.map((p) =>
          p.id === page.id ? { ...p, is_verified: verified, verified } : p,
        ),
      );
      toast(`Page "${page.name}" ${verified ? 'verified' : 'unverified'} successfully`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed';
      toast(message, 'error');
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await adminApi.delete(`/api/pages/${deleteTarget.id}`);
      setPages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast('Page deleted successfully', 'success');
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
      render: (row: Page) => (
        <span className="font-mono text-xs text-gray-400">{truncate(row.id, 8)}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row: Page) => <span className="text-white font-medium">{row.name}</span>,
    },
    {
      key: 'verified',
      header: 'Verified',
      render: (row: Page) =>
        isVerified(row) ? (
          <Badge variant="verified">verified</Badge>
        ) : (
          <Badge variant="pending">unverified</Badge>
        ),
    },
    {
      key: 'followers_count',
      header: 'Followers',
      sortable: true,
      render: (row: Page) => (
        <span className="text-gray-300">{row.followers_count ?? 0}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (row: Page) => (
        <span className="text-gray-400 text-xs">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Page) => (
        <div className="flex items-center gap-2 flex-wrap">
          {isVerified(row) ? (
            <Button size="sm" variant="outline" onClick={() => handleVerify(row, false)}>
              Unverify
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => handleVerify(row, true)}>
              Verify
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Pages</h1>

      <DataTable
        data={pages}
        columns={columns}
        loading={loading}
        pageSize={25}
        searchKeys={['name'] as (keyof Page)[]}
      />

      <Modal
        open={!!deleteTarget}
        danger
        title="Delete Page"
        description={`Are you sure you want to delete the page "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
