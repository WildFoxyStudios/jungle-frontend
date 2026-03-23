"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";

interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  domain?: string;
}

export function LinkPreview({ url }: { url: string }) {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchPreview() {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        
        if (mounted) {
          if (json.error || (!json.title && !json.image)) {
            setError(true);
          } else {
            setData(json);
          }
        }
      } catch (err) {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchPreview();

    return () => {
      mounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="mt-2 animate-pulse bg-slate-100 dark:bg-gray-800 rounded-xl h-24 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
        <Link2 className="text-slate-400" size={24} />
      </div>
    );
  }

  if (error || !data) {
    return null; // Don't show anything if we can't get a preview
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors group"
    >
      {data.image && (
        <div className="w-full aspect-[1.91/1] overflow-hidden bg-slate-100 dark:bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.image}
            alt={data.title || "Preview"}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div className="p-4 bg-slate-50 dark:bg-gray-800/20">
        <p className="text-xs text-slate-500 font-medium uppercase mb-1 truncate">
          {data.domain || new URL(url).hostname}
        </p>
        {data.title && (
          <h3 className="text-[0.9375rem] font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
            {data.title}
          </h3>
        )}
        {data.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-snug">
            {data.description}
          </p>
        )}
      </div>
    </a>
  );
}
