"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

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
  xs:  { container: "w-7 h-7",   text: "text-xs",  dot: "w-2 h-2", icon: 12 },
  sm:  { container: "w-9 h-9",   text: "text-sm",  dot: "w-2.5 h-2.5", icon: 14 },
  md:  { container: "w-11 h-11", text: "text-base", dot: "w-3 h-3",   icon: 18 },
  lg:  { container: "w-14 h-14", text: "text-lg",  dot: "w-3.5 h-3.5", icon: 22 },
  xl:  { container: "w-20 h-20", text: "text-2xl", dot: "w-4 h-4",   icon: 28 },
  "2xl": { container: "w-28 h-28", text: "text-4xl", dot: "w-5 h-5", icon: 36 },
};

function getInitials(name?: string) {
  if (!name) return "";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function stringToColor(str: string) {
  const colors = [
    "#4F46E5","#7C3AED","#EC4899","#EF4444","#F97316",
    "#EAB308","#22C55E","#14B8A6","#0EA5E9","#6366F1",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, alt, size = "md", online, className, onClick, fallbackName }: AvatarProps) {
  const s = sizes[size];
  const initials = getInitials(fallbackName ?? alt);
  const bgColor = fallbackName || alt ? stringToColor(fallbackName ?? alt ?? "") : "#94A3B8";

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          s.container,
          "rounded-full overflow-hidden relative",
          onClick && "cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all",
        )}
        onClick={onClick}
        style={{ backgroundColor: !src ? bgColor : undefined }}
      >
        {src ? (
          <Image src={src} alt={alt ?? ""} fill className="object-cover" sizes="112px" />
        ) : initials ? (
          <span className={cn("flex items-center justify-center w-full h-full text-white font-semibold select-none", s.text)}>
            {initials}
          </span>
        ) : (
          <span className="flex items-center justify-center w-full h-full text-white">
            <User size={s.icon} />
          </span>
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
