'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
import { truncate, formatDate } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  organizer_id?: string;
  organizer?: { username: string };
  start_date?: string;
  start_time?: string;
  attendees_count?: number;
  status?: string;
  created_at: string;
  [key: string]: unknown;
}

export default function EventsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await adminApi.get<Event[] | { events?: Event[]; data?: Event[] }>('/api/events');
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (raw.events ?? raw.data ?? []);
        setEvents(list);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load events';
        toast(message, 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [toast]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await adminApi.delete(`/api/events/${deleteTarget.id}`);
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast('Event deleted successfully', 'success');
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
      render: (row: Event) => (
        <span className="font-mono text-xs text-gray-400">{truncate(row.id, 8)}</span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (row: Event) => <span className="text-white font-medium">{row.title}</span>,
    },
    {
      key: 'organizer',
      header: 'Organizer',
      render: (row: Event) => (
        <span className="text-gray-300">{row.organizer?.username ?? '—'}</span>
      ),
    },
    {
      key: 'start_date',
      header: 'Start Date',
      sortable: true,
      render: (row: Event) => {
        const date = row.start_date ?? row.start_time;
        return (
          <span className="text-gray-400 text-xs">
            {date ? formatDate(date) : '—'}
          </span>
        );
      },
    },
    {
      key: 'attendees_count',
      header: 'Attendees',
      sortable: true,
      render: (row: Event) => (
        <span className="text-gray-300">{row.attendees_count ?? 0}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Event) => {
        const status = row.status ?? 'active';
        return <Badge variant={status}>{status}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Event) => (
        <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Events</h1>

      <DataTable
        data={events}
        columns={columns}
        loading={loading}
        pageSize={25}
        searchKeys={['title'] as (keyof Event)[]}
      />

      <Modal
        open={!!deleteTarget}
        danger
        title="Delete Event"
        description={`Are you sure you want to delete the event "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
