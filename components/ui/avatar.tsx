"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getProxyUrl } from "@/lib/media-proxy";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  online?: boolean;
  className?: string;
  onClick?: () => void;
  fallbackName?: string;
}

const sizes = {
  xs:  { container: "w-7 h-7",   dot: "w-2 h-2", text: "text-[10px]" },
  sm:  { container: "w-9 h-9",   dot: "w-2.5 h-2.5", text: "text-xs" },
  md:  { container: "w-11 h-11", dot: "w-3 h-3", text: "text-sm" },
  lg:  { container: "w-14 h-14", dot: "w-3.5 h-3.5", text: "text-base" },
  xl:  { container: "w-20 h-20", dot: "w-4 h-4", text: "text-xl" },
  "2xl": { container: "w-28 h-28", dot: "w-5 h-5", text: "text-2xl" },
};

// Generate initials from name
function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Generate consistent color from name
function getColorFromName(name?: string): string {
  const colors = [
    "bg-indigo-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, alt, size = "md", online, className, onClick, fallbackName }: AvatarProps) {
  const s = sizes[size];
  const [imgError, setImgError] = useState(false);
  
  const showFallback = !src || imgError;
  const initials = getInitials(fallbackName ?? alt);
  const bgColor = getColorFromName(fallbackName ?? alt);

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          s.container,
          "rounded-full overflow-hidden relative",
          showFallback ? bgColor : "bg-slate-100 dark:bg-gray-800",
          onClick && "cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all",
        )}
        onClick={onClick}
      >
        {!showFallback ? (
          <Image
            src={getProxyUrl(src!)}
            alt={alt ?? ""}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 32px, 44px"
            onError={() => setImgError(true)}
          />
        ) : fallbackName || alt ? (
          <span className={cn(
            "absolute inset-0 flex items-center justify-center font-bold text-white",
            s.text
          )}>
            {initials}
          </span>
        ) : (
          <Image src="/user.svg" alt="Usuario" fill className="object-cover p-2" sizes="112px" />
        )}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            s.dot,
            "absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-900",
            online ? "bg-green-500" : "bg-gray-400",
          )}
        />
      )}
    </div>
  );
}
