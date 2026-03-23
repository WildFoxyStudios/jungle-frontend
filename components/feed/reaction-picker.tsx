"use client";

import { useState, useRef, useEffect } from "react";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

const REACTIONS = [
  { type: "like", emoji: "👍", label: "Me gusta", color: "text-blue-600" },
  { type: "love", emoji: "❤️", label: "Me encanta", color: "text-red-500" },
  { type: "haha", emoji: "😂", label: "Me divierte", color: "text-amber-500" },
  { type: "wow", emoji: "😮", label: "Me asombra", color: "text-amber-500" },
  { type: "sad", emoji: "😢", label: "Me entristece", color: "text-blue-500" },
  { type: "angry", emoji: "😠", label: "Me enoja", color: "text-orange-600" },
  { type: "care", emoji: "🤗", label: "Me importa", color: "text-orange-400" },
];

const reactionColors: Record<string, string> = {
  like: "text-blue-600",
  love: "text-red-500",
  haha: "text-amber-500",
  wow: "text-amber-500",
  sad: "text-blue-500",
  angry: "text-orange-600",
  care: "text-orange-400",
};

interface ReactionPickerProps {
  postId: string;
  currentReaction?: string | null;
  reactionsCount: number;
  onReact: (type: string) => void;
  onRemove: () => void;
}

export function ReactionPicker({
  postId,
  currentReaction,
  reactionsCount,
  onReact,
  onRemove,
}: ReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const current = currentReaction
    ? REACTIONS.find((r) => r.type === currentReaction)
    : null;

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowPicker(true), 400);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowPicker(false), 200);
  };

  const handleClick = () => {
    if (currentReaction) onRemove();
    else onReact("like");
    setShowPicker(false);
  };

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          "hover:bg-slate-100 dark:hover:bg-gray-800",
          current
            ? reactionColors[current.type]
            : "text-slate-500 dark:text-slate-400",
        )}
      >
        {current ? (
          <span className="text-base leading-none">{current.emoji}</span>
        ) : (
          <ThumbsUp size={18} />
        )}
        <span>{current?.label ?? "Me gusta"}</span>
        {reactionsCount > 0 && (
          <span className="ml-0.5 text-slate-400">{reactionsCount}</span>
        )}
      </button>

      {showPicker && (
        <div
          className={cn(
            "absolute bottom-full left-0 mb-2 flex items-center gap-1 p-2",
            "bg-white dark:bg-gray-800 rounded-2xl shadow-2xl",
            "border border-slate-200 dark:border-slate-700",
            "animate-fade-in-scale z-50",
          )}
        >
          {REACTIONS.map((r, i) => (
            <button
              key={r.type}
              onClick={() => {
                onReact(r.type);
                setShowPicker(false);
              }}
              className={cn(
                "reaction-btn group flex flex-col items-center gap-1 p-1 rounded-xl",
                "hover:bg-slate-100 dark:hover:bg-gray-700",
                "transition-transform hover:scale-125",
                `stagger-${i + 1}`,
              )}
              title={r.label}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span
                className="text-2xl leading-none animate-reaction-pop"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {r.emoji}
              </span>
              <span className="reaction-label text-[10px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {r.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
