'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import Badge from '@/components/admin/Badge';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
import { formatDate } from '@/lib/utils';

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address: string;
  created_at: string;
  [key: string]: unknown;
}

export default function AuditLogPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuditLog() {
      try {
        const res = await adminApi.get<AuditLogEntry[] | { data?: AuditLogEntry[]; entries?: AuditLogEntry[] }>(
          '/api/security/audit-log',
        );
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (raw.entries ?? raw.data ?? []);
        setEntries(list);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load audit log';
        toast(message, 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchAuditLog();
  }, [toast]);

  const columns = [
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (row: AuditLogEntry) => (
        <span className="font-mono text-xs text-gray-200">{row.action}</span>
      ),
    },
    {
      key: 'entity_type',
      header: 'Entity Type',
      sortable: true,
      render: (row: AuditLogEntry) => (
        <Badge variant={row.entity_type}>{row.entity_type}</Badge>
      ),
    },
    {
      key: 'entity_id',
      header: 'Entity ID',
      render: (row: AuditLogEntry) => (
        <span className="font-mono text-xs text-gray-400">{row.entity_id}</span>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      render: (row: AuditLogEntry) => (
        <span className="font-mono text-xs text-gray-400">{row.ip_address}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      sortable: true,
      render: (row: AuditLogEntry) => (
        <span className="text-gray-400 text-xs">{formatDate(row.created_at, 'MMM d, yyyy HH:mm')}</span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck size={24} className="text-blue-400" />
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
      </div>

      <DataTable
        data={entries}
        columns={columns}
        loading={loading}
        pageSize={25}
        searchKeys={['action', 'entity_type']}
      />
    </div>
  );
}
