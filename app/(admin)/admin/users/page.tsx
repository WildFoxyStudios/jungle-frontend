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

interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role: string;
  email_verified: boolean;
  is_banned?: boolean;
  created_at: string;
  [key: string]: unknown;
}

interface UserProfile {
  id?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  [key: string]: unknown;
}

function getFullName(user: User): string {
  if (user.full_name) return user.full_name;
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.join(' ');
}

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Ban/Unban modal state
  const [banTarget, setBanTarget] = useState<User | null>(null);

  // Profile panel state
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await adminApi.get<User[]>('/api/admin/users');
        setUsers(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load users';
        toast(message, 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [toast]);

  async function handleBanConfirm() {
    if (!banTarget) return;
    const banned = !banTarget.is_banned;
    try {
      await adminApi.put(`/api/admin/users/${banTarget.id}/ban`, { banned });
      setUsers((prev) =>
        prev.map((u) => (u.id === banTarget.id ? { ...u, is_banned: banned } : u)),
      );
      toast(`User ${banTarget.username} ${banned ? 'banned' : 'unbanned'} successfully`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed';
      toast(message, 'error');
    } finally {
      setBanTarget(null);
    }
  }

  async function handleVerify(user: User) {
    try {
      await adminApi.put(`/api/admin/users/${user.id}/verify`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, email_verified: true } : u)),
      );
      toast(`User ${user.username} verified successfully`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      toast(message, 'error');
    }
  }

  async function openProfile(user: User) {
    setProfileUser(user);
    setProfile(null);
    setProfileLoading(true);
    try {
      const res = await adminApi.get<UserProfile>(`/api/profile/${user.id}`);
      setProfile(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      toast(message, 'error');
    } finally {
      setProfileLoading(false);
    }
  }

  function closeProfile() {
    setProfileUser(null);
    setProfile(null);
  }

  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (row: User) => (
        <span className="font-mono text-xs text-gray-400">{truncate(row.id, 8)}</span>
      ),
    },
    {
      key: 'username',
      header: 'Username',
      sortable: true,
      render: (row: User) => <span className="text-white font-medium">{row.username}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'full_name',
      header: 'Full Name',
      render: (row: User) => <span>{getFullName(row) || '—'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (row: User) => <Badge variant={row.role}>{row.role}</Badge>,
    },
    {
      key: 'email_verified',
      header: 'Verified',
      render: (row: User) => (
        <span className={row.email_verified ? 'text-green-400' : 'text-red-400'}>
          {row.email_verified ? '✓' : '✗'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (row: User) => (
        <span className="text-gray-400 text-xs">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: User) => (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={row.is_banned ? 'outline' : 'danger'}
            onClick={() => setBanTarget(row)}
          >
            {row.is_banned ? 'Unban' : 'Ban'}
          </Button>
          {!row.email_verified && (
            <Button size="sm" variant="outline" onClick={() => handleVerify(row)}>
              Verify
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => openProfile(row)}>
            View Profile
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Users</h1>

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        pageSize={25}
        searchKeys={['username', 'email', 'full_name'] as (keyof User)[]}
      />

      {/* Ban / Unban confirmation modal */}
      <Modal
        open={!!banTarget}
        danger={!banTarget?.is_banned}
        title={banTarget?.is_banned ? 'Unban User' : 'Ban User'}
        description={
          banTarget?.is_banned
            ? `Are you sure you want to unban ${banTarget?.username}?`
            : `Are you sure you want to ban ${banTarget?.username}?`
        }
        onConfirm={handleBanConfirm}
        onCancel={() => setBanTarget(null)}
      />

      {/* View Profile slide-in panel */}
      {profileUser && (
        <div className="fixed inset-0 z-40" onClick={closeProfile}>
          <div
            className="absolute right-0 top-0 h-full w-full sm:w-96 bg-gray-900 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-white font-semibold">User Profile</h2>
              <button
                onClick={closeProfile}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close profile panel"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {profileLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Avatar + username */}
                  <div className="flex items-center gap-4">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profileUser.username}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl text-gray-400 font-bold">
                        {profileUser.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold text-lg">
                        {profile?.username ?? profileUser.username}
                      </p>
                      <p className="text-gray-400 text-sm">{profileUser.email}</p>
                    </div>
                  </div>

                  {/* Bio */}
                  {profile?.bio && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Bio</p>
                      <p className="text-gray-300 text-sm">{profile.bio}</p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-white font-bold text-lg">
                        {profile?.followers_count ?? 0}
                      </p>
                      <p className="text-gray-400 text-xs">Followers</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-white font-bold text-lg">
                        {profile?.following_count ?? 0}
                      </p>
                      <p className="text-gray-400 text-xs">Following</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-white font-bold text-lg">
                        {profile?.posts_count ?? 0}
                      </p>
                      <p className="text-gray-400 text-xs">Posts</p>
                    </div>
                  </div>

                  {/* Extra user info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Role</span>
                      <Badge variant={profileUser.role}>{profileUser.role}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email Verified</span>
                      <span className={profileUser.email_verified ? 'text-green-400' : 'text-red-400'}>
                        {profileUser.email_verified ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className={profileUser.is_banned ? 'text-red-400' : 'text-green-400'}>
                        {profileUser.is_banned ? 'Banned' : 'Active'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Joined</span>
                      <span className="text-gray-300">{formatDate(profileUser.created_at)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
