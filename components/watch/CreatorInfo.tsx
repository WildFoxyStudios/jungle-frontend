"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { watchApi } from "@/lib/api-watch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export interface CreatorInfoProps {
  userId: string;
  username?: string;
  avatarUrl?: string;
  publishedAt?: string;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
}

function formatRelativeDate(dateStr?: string): string {
  if (!dateStr) return "";
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `hace ${diffD}d`;
  const diffW = Math.floor(diffD / 7);
  if (diffW < 4) return `hace ${diffW}sem`;
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Displays creator avatar, name, publication date, and a Follow/Following toggle.
 * Clicking name or avatar navigates to /profile/{user_id}.
 */
export function CreatorInfo({
  userId,
  username,
  avatarUrl,
  publishedAt,
  isFollowing: initialFollowing = false,
  onFollowToggle,
}: CreatorInfoProps) {
  const toast = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  const handleFollowToggle = async () => {
    if (busy) return;
    const prev = following;
    setFollowing(!prev);
    setBusy(true);
    try {
      if (prev) {
        await watchApi.unsubscribeFromCreator(userId);
      } else {
        await watchApi.subscribeToCreator(userId);
      }
      onFollowToggle?.();
    } catch {
      setFollowing(prev);
      toast.error("Error al actualizar suscripción");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Link href={`/profile/${userId}`} aria-label={`Perfil de ${username ?? "usuario"}`}>
        <Avatar src={avatarUrl} alt={username ?? "Creador"} size="sm" />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${userId}`}
          className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:underline truncate block"
        >
          {username ?? "Usuario"}
        </Link>
        {publishedAt && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {formatRelativeDate(publishedAt)}
          </span>
        )}
      </div>

      <button
        onClick={handleFollowToggle}
        disabled={busy}
        className={cn(
          "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0",
          following
            ? "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700"
            : "bg-indigo-600 text-white hover:bg-indigo-700",
          busy && "opacity-60 cursor-not-allowed",
        )}
      >
        {following ? "Siguiendo" : "Seguir"}
      </button>
    </div>
  );
}
