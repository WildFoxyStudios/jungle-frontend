'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
import { truncate, formatDate } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type?: string;
  type?: string;
  status?: string;
  created_at: string;
  [key: string]: unknown;
}

export default function JobsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await adminApi.get<Job[] | { jobs?: Job[]; data?: Job[] }>('/api/jobs/search', {
          params: { limit: 100 },
        });
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (raw.jobs ?? raw.data ?? []);
        setJobs(list);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load jobs';
        toast(message, 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [toast]);

  async function handleClose(job: Job) {
    try {
      await adminApi.post(`/api/jobs/${job.id}/close`);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: 'closed' } : j)),
      );
      toast(`Job "${job.title}" closed successfully`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Close failed';
      toast(message, 'error');
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await adminApi.delete(`/api/jobs/${deleteTarget.id}`);
      setJobs((prev) => prev.filter((j) => j.id !== deleteTarget.id));
      toast('Job deleted successfully', 'success');
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
      render: (row: Job) => (
        <span className="font-mono text-xs text-gray-400">{truncate(row.id, 8)}</span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (row: Job) => <span className="text-white font-medium">{row.title}</span>,
    },
    {
      key: 'company',
      header: 'Company',
      sortable: true,
      render: (row: Job) => <span className="text-gray-300">{row.company}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      sortable: true,
      render: (row: Job) => <span className="text-gray-300">{row.location}</span>,
    },
    {
      key: 'job_type',
      header: 'Type',
      render: (row: Job) => {
        const type = row.job_type ?? row.type ?? '—';
        return <span className="text-gray-300">{type}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Job) => {
        const status = row.status ?? 'active';
        return <Badge variant={status}>{status}</Badge>;
      },
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (row: Job) => (
        <span className="text-gray-400 text-xs">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Job) => (
        <div className="flex items-center gap-2">
          {row.status !== 'closed' && (
            <Button size="sm" variant="outline" onClick={() => handleClose(row)}>
              Close
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
      <h1 className="text-2xl font-bold text-white">Jobs</h1>

      <DataTable
        data={jobs}
        columns={columns}
        loading={loading}
        pageSize={25}
        searchKeys={['title', 'company'] as (keyof Job)[]}
      />

      <Modal
        open={!!deleteTarget}
        danger
        title="Delete Job"
        description={`Are you sure you want to delete the job "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
