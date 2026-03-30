'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/api-admin';
const TITLE_MAX = 100;
const BODY_MAX = 500;

export default function NotificationsPage() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowPreview(true);
  }

  async function handleConfirm() {
    setSending(true);
    try {
      await adminApi.post('/api/notifications/broadcast', { title, body });
      toast('Broadcast sent successfully', 'success');
      setTitle('');
      setBody('');
      setShowPreview(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send broadcast';
      toast(message, 'error');
      setShowPreview(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Bell size={24} className="text-blue-400" />
        <h1 className="text-2xl font-bold text-white">System Notifications</h1>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-400 text-sm mb-6">
          Send a broadcast announcement to all users on the platform.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-300" htmlFor="notif-title">
                Title <span className="text-red-400">*</span>
              </label>
              <span className={`text-xs ${title.length >= TITLE_MAX ? 'text-red-400' : 'text-gray-500'}`}>
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            <input
              id="notif-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
              required
              maxLength={TITLE_MAX}
              placeholder="Announcement title"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-300" htmlFor="notif-body">
                Body <span className="text-red-400">*</span>
              </label>
              <span className={`text-xs ${body.length >= BODY_MAX ? 'text-red-400' : 'text-gray-500'}`}>
                {body.length}/{BODY_MAX}
              </span>
            </div>
            <textarea
              id="notif-body"
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
              required
              maxLength={BODY_MAX}
              rows={6}
              placeholder="Write your announcement here…"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm resize-none"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!title.trim() || !body.trim()}>
              Preview &amp; Send
            </Button>
          </div>
        </form>
      </div>

      <Modal
        open={showPreview}
        title={`Preview: ${title}`}
        description={body}
        onConfirm={handleConfirm}
        onCancel={() => setShowPreview(false)}
      />

      {sending && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg px-6 py-4 text-white text-sm">Sending…</div>
        </div>
      )}
    </div>
  );
}
