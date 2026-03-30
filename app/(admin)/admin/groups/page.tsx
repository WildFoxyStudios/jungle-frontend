'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import Skeleton from '@/components/admin/Skeleton';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
import { truncate, formatDate } from '@/lib/utils';

interface Group {
  id: string;
  name: string;
  privacy: string;
  member_count?: number;
  members_count?: number;
  created_at: string;
  [key: string]: unknown;
}

interface Member {
  id: string;
  username: string;
  avatar_url?: string;
}

export default function GroupsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [membersGroup, setMembersGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await adminApi.get<Group[] | { groups?: Group[]; data?: Group[] }>('/api/groups');
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (raw.groups ?? raw.data ?? []);
        setGroups(list);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load groups';
        toast(message, 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchGroups();
  }, [toast]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await adminApi.delete(`/api/groups/${deleteTarget.id}`);
      setGroups((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      toast('Group deleted successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast(message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  async function openMembers(group: Group) {
    setMembersGroup(group);
    setMembers([]);
    setMembersLoading(true);
    try {
      const res = await adminApi.get<Member[] | { members?: Member[]; data?: Member[] }>(
        `/api/groups/${group.id}/members`,
      );
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw.members ?? raw.data ?? []);
      setMembers(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load members';
      toast(message, 'error');
    } finally {
      setMembersLoading(false);
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (row: Group) => (
        <span className="font-mono text-xs text-gray-400">{truncate(row.id, 8)}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row: Group) => <span className="text-white font-medium">{row.name}</span>,
    },
    {
      key: 'privacy',
      header: 'Privacy',
      render: (row: Group) => <Badge variant={row.privacy}>{row.privacy}</Badge>,
    },
    {
      key: 'member_count',
      header: 'Members',
      sortable: true,
      render: (row: Group) => (
        <span className="text-gray-300">{row.member_count ?? row.members_count ?? 0}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (row: Group) => (
        <span className="text-gray-400 text-xs">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Group) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => openMembers(row)}>
            Members
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
      <h1 className="text-2xl font-bold text-white">Groups</h1>

      <DataTable
        data={groups}
        columns={columns}
        loading={loading}
        pageSize={25}
        searchKeys={['name'] as (keyof Group)[]}
      />

      <Modal
        open={!!deleteTarget}
        danger
        title="Delete Group"
        description={`Are you sure you want to delete the group "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Members slide-in panel */}
      {membersGroup && (
        <div className="fixed inset-0 z-40" onClick={() => setMembersGroup(null)}>
          <div
            className="absolute right-0 top-0 h-full w-full sm:w-96 bg-gray-900 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-white font-semibold">
                Members — {membersGroup.name}
              </h2>
              <button
                onClick={() => setMembersGroup(null)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close members panel"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {membersLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))
              ) : members.length === 0 ? (
                <p className="text-gray-500 text-sm">No members found.</p>
              ) : (
                members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    {m.avatar_url ? (
                      <img
                        src={m.avatar_url}
                        alt={m.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold">
                        {m.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-gray-200 text-sm">{m.username}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
