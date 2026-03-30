'use client';

import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import Button from '@/components/admin/Button';
import { useToast } from '@/contexts/ToastContext';

const STORAGE_KEY = 'admin_settings';

const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;
type DateFormat = (typeof DATE_FORMATS)[number];

interface AdminSettings {
  apiBaseUrl: string;
  itemsPerPage: number;
  dateFormat: DateFormat;
}

function loadSettings(): AdminSettings {
  if (typeof window === 'undefined') {
    return {
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
      itemsPerPage: 25,
      dateFormat: 'MM/DD/YYYY',
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AdminSettings>;
      return {
        apiBaseUrl: parsed.apiBaseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? '',
        itemsPerPage: parsed.itemsPerPage ?? 25,
        dateFormat: (DATE_FORMATS as readonly string[]).includes(parsed.dateFormat ?? '')
          ? (parsed.dateFormat as DateFormat)
          : 'MM/DD/YYYY',
      };
    }
  } catch {
    // ignore parse errors
  }
  return {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
    itemsPerPage: 25,
    dateFormat: 'MM/DD/YYYY',
  };
}

export default function SettingsPage() {
  const { toast } = useToast();

  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [dateFormat, setDateFormat] = useState<DateFormat>('MM/DD/YYYY');
  const [itemsError, setItemsError] = useState('');

  useEffect(() => {
    const s = loadSettings();
    setApiBaseUrl(s.apiBaseUrl);
    setItemsPerPage(s.itemsPerPage);
    setDateFormat(s.dateFormat);
  }, []);

  function validateItemsPerPage(value: number): string {
    if (isNaN(value) || value < 10) return 'Must be at least 10';
    if (value > 200) return 'Must be at most 200';
    return '';
  }

  function handleItemsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    setItemsPerPage(isNaN(val) ? 0 : val);
    setItemsError(validateItemsPerPage(isNaN(val) ? 0 : val));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const err = validateItemsPerPage(itemsPerPage);
    if (err) {
      setItemsError(err);
      return;
    }
    const settings: AdminSettings = { apiBaseUrl, itemsPerPage, dateFormat };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast('Settings saved', 'success');
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={24} className="text-blue-400" />
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* API Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="api-base-url">
              API Base URL
            </label>
            <input
              id="api-base-url"
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Defaults to <code className="text-gray-400">NEXT_PUBLIC_API_URL</code>
            </p>
          </div>

          {/* Items Per Page */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="items-per-page">
              Default Items Per Page
            </label>
            <input
              id="items-per-page"
              type="number"
              min={10}
              max={200}
              value={itemsPerPage}
              onChange={handleItemsChange}
              className={`w-full bg-gray-900 border rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none text-sm ${
                itemsError ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-blue-500'
              }`}
            />
            {itemsError ? (
              <p className="text-xs text-red-400 mt-1">{itemsError}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Between 10 and 200</p>
            )}
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="date-format">
              Preferred Date Format
            </label>
            <select
              id="date-format"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value as DateFormat)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
            >
              {DATE_FORMATS.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={!!itemsError}>
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
