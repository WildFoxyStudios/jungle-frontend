"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";

// ─── Embed detection ──────────────────────────────────────────────────────────

function isDirectVideoUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return /\.(mp4|webm|mov|ogg)(\?.*)?$/.test(path);
  } catch {}
  return false;
}

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }
  } catch {}
  return null;
}

function getVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("vimeo.com")) {
      const match = u.pathname.match(/\/(\d+)/);
      return match ? match[1] : null;
    }
  } catch {}
  return null;
}

function getSpotifyEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("spotify.com")) {
      // https://open.spotify.com/track/xxx → https://open.spotify.com/embed/track/xxx
      return url.replace("open.spotify.com/", "open.spotify.com/embed/");
    }
  } catch {}
  return null;
}

// ─── OG Preview data ──────────────────────────────────────────────────────────

interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  domain?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LinkPreview({ url }: { url: string }) {
  const youtubeId = getYouTubeId(url);
  const vimeoId = getVimeoId(url);
  const spotifyEmbed = getSpotifyEmbed(url);

  // ── Direct video file ──────────────────────────────────────────────────────
  if (isDirectVideoUrl(url)) {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black">
        <video
          src={url}
          controls
          playsInline
          className="w-full max-h-[480px]"
          preload="metadata"
        />
      </div>
    );
  }

  // ── YouTube embed ──────────────────────────────────────────────────────────
  if (youtubeId) {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          loading="lazy"
        />
      </div>
    );
  }

  // ── Vimeo embed ────────────────────────────────────────────────────────────
  if (vimeoId) {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?byline=0&portrait=0`}
          title="Vimeo video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          loading="lazy"
        />
      </div>
    );
  }

  // ── Spotify embed ──────────────────────────────────────────────────────────
  if (spotifyEmbed) {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <iframe
          src={spotifyEmbed}
          title="Spotify"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="w-full"
          height="152"
          loading="lazy"
        />
      </div>
    );
  }

  // ── Generic OG preview ─────────────────────────────────────────────────────
  return <OGPreview url={url} />;
}

// ─── OG Preview (generic links) ───────────────────────────────────────────────

function OGPreview({ url }: { url: string }) {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchPreview() {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (mounted) {
          if (json.error || (!json.title && !json.image)) setError(true);
          else setData(json);
        }
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchPreview();
    return () => { mounted = false; };
  }, [url]);

  if (loading) {
    return (
      <div className="mt-2 animate-pulse bg-slate-100 dark:bg-gray-800 rounded-xl h-24 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
        <Link2 className="text-slate-400" size={24} />
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors group"
    >
      {data.image && (
        <div className="w-full aspect-[1.91/1] overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img
            src={data.image}
            alt={data.title || "Preview"}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
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
