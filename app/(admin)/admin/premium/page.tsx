'use client';

import { useEffect, useState, useCallback } from 'react';
import { Star, Users, TrendingUp, DollarSign } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import KpiCard from '@/components/admin/KpiCard';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
import { truncate, formatDate } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BoostedPost {
  id: string;
  post_id?: string;
  budget: number;
  duration_days?: number;
  duration?: number;
  status: string;
  impressions: number;
  clicks: number;
  created_at: string;
  [key: string]: unknown;
}

interface Subscription {
  id: string;
  subscriber?: string;
  user?: { username: string };
  creator?: string;
  creator_user?: { username: string };
  tier: string;
  status: string;
  amount?: number;
  price?: number;
  created_at: string;
  [key: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPostId(b: BoostedPost): string {
  return b.post_id ?? b.id;
}

function getDuration(b: BoostedPost): number {
  return b.duration_days ?? b.duration ?? 0;
}

function getSubscriber(s: Subscription): string {
  if (s.subscriber) return s.subscriber;
  if (s.user?.username) return s.user.username;
  return '—';
}

function getCreator(s: Subscription): string {
  if (s.creator) return s.creator;
  if (s.creator_user?.username) return s.creator_user.username;
  return '—';
}

// ─── Boosted Posts Tab ────────────────────────────────────────────────────────

function BoostedPostsTab() {
  const { toast } = useToast();
  const [boosts, setBoosts] = useState<BoostedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoosts = useCallback(async () => {
    try {
      const res = await adminApi.get<BoostedPost[] | { boosts?: BoostedPost[]; data?: BoostedPost[] }>(
        '/api/premium/boosts',
      );
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw.boosts ?? raw.data ?? []);
      setBoosts(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load boosted posts';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBoosts();
  }, [fetchBoosts]);

  const columns = [
    {
      key: 'post_id',
      header: 'Post ID',
      sortable: true,
      render: (row: BoostedPost) => (
        <span className="font-mono text-xs text-gray-400">{truncate(getPostId(row), 8)}</span>
      ),
    },
    {
      key: 'budget',
      header: 'Budget',
      sortable: true,
      render: (row: BoostedPost) => (
        <span className="text-gray-300">${Number(row.budget).toLocaleString()}</span>
      ),
    },
    {
      key: 'duration_days',
      header: 'Duration (days)',
      sortable: true,
      render: (row: BoostedPost) => (
        <span className="text-gray-300">{getDuration(row)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: BoostedPost) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      key: 'impressions',
      header: 'Impressions',
      sortable: true,
      render: (row: BoostedPost) => (
        <span className="text-gray-300">{Number(row.impressions).toLocaleString()}</span>
      ),
    },
    {
      key: 'clicks',
      header: 'Clicks',
      sortable: true,
      render: (row: BoostedPost) => (
        <span className="text-gray-300">{Number(row.clicks).toLocaleString()}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (row: BoostedPost) => (
        <span className="text-gray-400 text-xs">{formatDate(row.created_at)}</span>
      ),
    },
  ];

  return (
    <DataTable
      data={boosts}
      columns={columns}
      loading={loading}
      pageSize={25}
      searchKeys={['post_id', 'status'] as (keyof BoostedPost)[]}
    />
  );
}

// ─── Creator Subscriptions Tab ────────────────────────────────────────────────

function CreatorSubscriptionsTab() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await adminApi.get<
        Subscription[] | { subscriptions?: Subscription[]; data?: Subscription[] }
      >('/api/premium/subscriptions');
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw.subscriptions ?? raw.data ?? []);
      setSubscriptions(list);
    } catch {
      // fallback to /api/subscriptions
      try {
        const res2 = await adminApi.get<
          Subscription[] | { subscriptions?: Subscription[]; data?: Subscription[] }
        >('/api/subscriptions');
        const raw2 = res2.data;
        const list2 = Array.isArray(raw2) ? raw2 : (raw2.subscriptions ?? raw2.data ?? []);
        setSubscriptions(list2);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load subscriptions';
        toast(message, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Group by tier for KPI cards
  const tierCounts = subscriptions.reduce<Record<string, number>>((acc, s) => {
    const tier = s.tier ?? 'unknown';
    acc[tier] = (acc[tier] ?? 0) + 1;
    return acc;
  }, {});

  const tierIcons: Record<string, React.ReactNode> = {
    basic: <Star size={18} />,
    pro: <TrendingUp size={18} />,
    premium: <DollarSign size={18} />,
  };

  const tierEntries = Object.entries(tierCounts);

  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (row: Subscription) => (
        <span className="font-mono text-xs text-gray-400">{truncate(row.id, 8)}</span>
      ),
    },
    {
      key: 'subscriber',
      header: 'Subscriber',
      sortable: true,
      render: (row: Subscription) => (
        <span className="text-gray-300">{getSubscriber(row)}</span>
      ),
    },
    {
      key: 'creator',
      header: 'Creator',
      sortable: true,
      render: (row: Subscription) => (
        <span className="text-gray-300">{getCreator(row)}</span>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      sortable: true,
      render: (row: Subscription) => (
        <Badge variant={row.tier}>{row.tier}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: Subscription) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (row: Subscription) => {
        const val = row.amount ?? row.price;
        return (
          <span className="text-gray-300">
            {val != null ? `$${Number(val).toFixed(2)}` : '—'}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (row: Subscription) => (
        <span className="text-gray-400 text-xs">{formatDate(row.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards by tier */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Subscriptions"
          value={loading ? '—' : subscriptions.length}
          icon={<Users size={18} />}
          loading={loading}
        />
        {tierEntries.map(([tier, count]) => (
          <KpiCard
            key={tier}
            title={`${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier`}
            value={count}
            icon={tierIcons[tier.toLowerCase()] ?? <Star size={18} />}
            loading={loading}
          />
        ))}
      </div>

      {/* Full subscriptions table */}
      <DataTable
        data={subscriptions}
        columns={columns}
        loading={loading}
        pageSize={25}
        searchKeys={['subscriber', 'creator', 'tier'] as (keyof Subscription)[]}
      />
    </div>
  );
}

// ─── Withdrawal Requests Tab ──────────────────────────────────────────────────

interface WithdrawalRequest {
  id: string;
  user_id: string;
  username: string;
  amount: string;
  status: string;
  method: string;
  paypal_email?: string;
  created_at: string;
  [key: string]: unknown;
}

function WithdrawalsTab() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await adminApi.get<WithdrawalRequest[]>('/api/admin/withdrawals');
      setRequests(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load withdrawals';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleProcess = async (id: string, status: 'completed' | 'rejected') => {
    try {
      await adminApi.put(`/api/admin/withdrawals/${id}/process`, { status });
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
      toast(`Withdrawal ${status} successfully`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to process withdrawal';
      toast(message, 'error');
    }
  };

  const columns = [
    {
      key: 'username',
      header: 'Creator',
      sortable: true,
      render: (row: WithdrawalRequest) => <span className="text-white font-medium">{row.username}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (row: WithdrawalRequest) => <span className="text-green-400 font-bold">€{row.amount}</span>,
    },
    {
      key: 'method',
      header: 'Method',
      render: (row: WithdrawalRequest) => <Badge variant="outline">{row.method}</Badge>,
    },
    {
      key: 'paypal_email',
      header: 'Details',
      render: (row: WithdrawalRequest) => (
        <span className="text-gray-400 text-xs">{row.paypal_email || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: WithdrawalRequest) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      render: (row: WithdrawalRequest) => <span className="text-gray-500 text-xs">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: WithdrawalRequest) => (
        row.status === 'pending' ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleProcess(row.id, 'completed')}>Approve</Button>
            <Button size="sm" variant="danger" onClick={() => handleProcess(row.id, 'rejected')}>Reject</Button>
          </div>
        ) : null
      ),
    },
  ];

  return (
    <DataTable
      data={requests}
      columns={columns}
      loading={loading}
      pageSize={25}
      searchKeys={['username', 'paypal_email'] as (keyof WithdrawalRequest)[]}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'boosts' | 'subscriptions' | 'withdrawals';

export default function PremiumPage() {
  const [activeTab, setActiveTab] = useState<Tab>('withdrawals'); // Default to withdrawals for admin actionability

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Premium</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('boosts')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'boosts'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Boosted Posts
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'subscriptions'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Creator Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'withdrawals'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Withdrawal Requests
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'boosts' && <BoostedPostsTab />}
      {activeTab === 'subscriptions' && <CreatorSubscriptionsTab />}
      {activeTab === 'withdrawals' && <WithdrawalsTab />}
    </div>
  );
}
