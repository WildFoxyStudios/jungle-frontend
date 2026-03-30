'use client';

import { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, Flag, EyeOff, Trash2, Clock } from 'lucide-react';
import KpiCard from '@/components/admin/KpiCard';
import BarChart from '@/components/admin/charts/BarChart';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import Skeleton from '@/components/admin/Skeleton';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
import { formatDate, truncate } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModerationStats {
  total_flagged: number;
  pending: number;
  hidden: number;
  deleted: number;
  categories: {
    sexual: number;
    hate: number;
    harassment: number;
    violence: number;
    self_harm: number;
  };
}

interface Report {
  id: string;
  content_type: string;
  content_id: string;
  analyzed_text?: string;
  reason?: string;
  created_at: string;
  status: string;
  [key: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deleteEndpoint(contentType: string, contentId: string): string {
  switch (contentType) {
    case 'post':      return `/api/posts/${contentId}`;
    case 'comment':   return `/api/posts/comments/${contentId}`;
    case 'story':     return `/api/stories/${contentId}`;
    case 'reel':      return `/api/reels/${contentId}`;
    default:          return `/api/posts/${contentId}`;
  }
}

function categoryChartData(categories: ModerationStats['categories']) {
  return [
    { category: 'Sexual',     count: categories.sexual },
    { category: 'Hate',       count: categories.hate },
    { category: 'Harassment', count: categories.harassment },
    { category: 'Violence',   count: categories.violence },
    { category: 'Self-harm',  count: categories.self_harm },
  ];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-6">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-16 mb-2" />
          </div>
        ))}
      </div>
      <div className="bg-gray-800 rounded-lg p-6">
        <Skeleton className="h-4 w-40 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    </div>
  );
}

function ReportCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ModerationPage() {
  const { toast } = useToast();

  // Stats
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Report queue (pending)
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // History (resolved)
  const [history, setHistory] = useState<Report[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Remove-content modal
  const [removeTarget, setRemoveTarget] = useState<Report | null>(null);
  const [removing, setRemoving] = useState(false);

  // ── Fetch stats ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await adminApi.get<ModerationStats>('/api/moderation/stats');
        setStats(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load moderation stats';
        toast(message, 'error');
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, [toast]);

  // ── Fetch pending reports ────────────────────────────────────────────────
  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await adminApi.get<Report[]>('/api/admin/reports');
        const pending = (res.data ?? [])
          .filter((r) => r.status === 'pending' || r.status === 'flagged' || !r.status)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setReports(pending);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load reports';
        toast(message, 'error');
      } finally {
        setReportsLoading(false);
      }
    }
    fetchReports();
  }, [toast]);

  // ── Fetch history ────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await adminApi.get<Report[]>('/api/admin/reports', {
          params: { status: 'resolved', limit: 50 },
        });
        setHistory(res.data ?? []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load moderation history';
        toast(message, 'error');
      } finally {
        setHistoryLoading(false);
      }
    }
    fetchHistory();
  }, [toast]);

  // ── Remove content ───────────────────────────────────────────────────────
  const handleRemoveConfirm = useCallback(async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await adminApi.put(`/api/admin/reports/${removeTarget.id}/resolve`, { action: 'delete' });
      setReports((prev) => prev.filter((r) => r.id !== removeTarget.id));
      toast('Content removed and report resolved', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resolve report';
      toast(message, 'error');
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  }, [removeTarget, toast]);

  // ── Dismiss report ───────────────────────────────────────────────────────
  const handleDismiss = useCallback(async (report: Report) => {
    try {
      await adminApi.put(`/api/admin/reports/${report.id}/resolve`, { action: 'dismiss' });
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      toast('Report dismissed', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to dismiss report';
      toast(message, 'error');
    }
  }, [toast]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-white">Content Moderation</h1>

      {/* ── Stats panel ── */}
      {statsLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="Total Flagged"
              value={stats?.total_flagged ?? 0}
              icon={<ShieldAlert size={20} />}
            />
            <KpiCard
              title="Pending"
              value={stats?.pending ?? 0}
              icon={<Flag size={20} />}
            />
            <KpiCard
              title="Hidden"
              value={stats?.hidden ?? 0}
              icon={<EyeOff size={20} />}
            />
            <KpiCard
              title="Deleted"
              value={stats?.deleted ?? 0}
              icon={<Trash2 size={20} />}
            />
          </div>

          {stats?.categories && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white font-semibold mb-4">Flags by Category</h2>
              <BarChart
                data={categoryChartData(stats.categories)}
                xKey="category"
                yKey="count"
                color="#ef4444"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Report queue ── */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Pending Reports</h2>
        {reportsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <ReportCardSkeleton key={i} />)}
          </div>
        ) : reports.length === 0 ? (
          <p className="text-gray-500 text-sm">No pending reports.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={report.content_type}>{report.content_type}</Badge>
                  <span className="text-gray-400 text-xs font-mono">
                    ID: {truncate(report.content_id, 20)}
                  </span>
                  <span className="text-gray-500 text-xs ml-auto flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(report.created_at, 'MMM d, yyyy HH:mm')}
                  </span>
                </div>

                {(report.analyzed_text || report.reason) && (
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {truncate(report.analyzed_text ?? report.reason ?? '', 150)}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setRemoveTarget(report)}
                  >
                    Remove Content
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(report)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Moderation history ── */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Moderation History (last 50)</h2>
        {historyLoading ? (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        ) : history.length === 0 ? (
          <p className="text-gray-500 text-sm">No resolved reports yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full text-sm text-left text-gray-300 bg-gray-800">
              <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Content Type</th>
                  <th className="px-4 py-3">Content ID</th>
                  <th className="px-4 py-3">Action Taken</th>
                  <th className="px-4 py-3">Resolved At</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3">
                      <Badge variant={item.content_type}>{item.content_type}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {truncate(item.content_id, 24)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.status}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {formatDate(item.created_at, 'MMM d, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Remove content modal ── */}
      <Modal
        open={!!removeTarget}
        title="Remove Content"
        description={
          removeTarget
            ? `Are you sure you want to permanently delete this ${removeTarget.content_type} (ID: ${truncate(removeTarget.content_id, 20)})? This action cannot be undone.`
            : ''
        }
        onConfirm={handleRemoveConfirm}
        onCancel={() => setRemoveTarget(null)}
        danger
      />
    </div>
  );
}
