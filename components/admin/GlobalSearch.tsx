'use client';

import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import Badge from '@/components/admin/Badge';
import Skeleton from '@/components/admin/Skeleton';

type EntityType = 'users' | 'posts' | 'groups' | 'pages' | 'events';

interface SearchResult {
  id: string | number;
  name?: string;
  title?: string;
  type: EntityType;
}

interface SearchResponse {
  users?: SearchResult[];
  posts?: SearchResult[];
  groups?: SearchResult[];
  pages?: SearchResult[];
  events?: SearchResult[];
}

const ENTITY_ROUTES: Record<EntityType, string> = {
  users: '/users',
  posts: '/posts',
  groups: '/groups',
  pages: '/pages',
  events: '/events',
};

const ENTITY_LABELS: Record<EntityType, string> = {
  users: 'Users',
  posts: 'Posts',
  groups: 'Groups',
  pages: 'Pages',
  events: 'Events',
};

const ENTITY_ORDER: EntityType[] = ['users', 'posts', 'groups', 'pages', 'events'];

function getDisplayName(result: SearchResult): string {
  return result.name ?? result.title ?? `#${result.id}`;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults(null);
        setIsOpen(false);
        return;
      }
      setIsLoading(true);
      setIsOpen(true);
      try {
        const res = await api.get<SearchResponse>('/api/search', { params: { q } });
        setResults(res.data);
      } catch {
        toast('Search failed. Please try again.', 'error');
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleResultClick = (type: EntityType) => {
    router.push(ENTITY_ROUTES[type]);
    setIsOpen(false);
    setQuery('');
    setResults(null);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasResults =
    results &&
    ENTITY_ORDER.some((type) => (results[type]?.length ?? 0) > 0);

  return (
    <div ref={containerRef} className="relative flex items-center">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search size={16} className="absolute left-3 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="bg-gray-800 text-sm text-white placeholder-gray-400 rounded pl-9 pr-8 py-1.5 w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-gray-600"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-gray-400 hover:text-white"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </form>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full sm:w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {isLoading ? (
            <div className="p-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto py-1">
              {ENTITY_ORDER.map((type) => {
                const items = results?.[type];
                if (!items?.length) return null;
                return (
                  <div key={type}>
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900/80 sticky top-0">
                      {ENTITY_LABELS[type]}
                    </div>
                    {items.map((item) => (
                      <button
                        key={`${type}-${item.id}`}
                        onClick={() => handleResultClick(type)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-800 transition-colors"
                      >
                        <span className="flex-1 truncate text-white">
                          {getDisplayName(item)}
                        </span>
                        <Badge variant={type}>{ENTITY_LABELS[type]}</Badge>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
