"use client";

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
  xs:  { container: "w-7 h-7",   dot: "w-2 h-2" },
  sm:  { container: "w-9 h-9",   dot: "w-2.5 h-2.5" },
  md:  { container: "w-11 h-11", dot: "w-3 h-3" },
  lg:  { container: "w-14 h-14", dot: "w-3.5 h-3.5" },
  xl:  { container: "w-20 h-20", dot: "w-4 h-4" },
  "2xl": { container: "w-28 h-28", dot: "w-5 h-5" },
};

export function Avatar({ src, alt, size = "md", online, className, onClick, fallbackName }: AvatarProps) {
  const s = sizes[size];

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          s.container,
          "rounded-full overflow-hidden relative bg-slate-100 dark:bg-gray-800",
          onClick && "cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all",
        )}
        onClick={onClick}
      >
        {src ? (
          <Image
            src={getProxyUrl(src)}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 32px, 44px"
          />
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
