"use client";

import { useState, useRef, useEffect } from "react";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

const REACTIONS = [
  { type: "like", emoji: "👍", label: "Me gusta", color: "text-[#1877f2]" },
  { type: "love", emoji: "❤️", label: "Me encanta", color: "text-[#f33e58]" },
  { type: "haha", emoji: "😂", label: "Me divierte", color: "text-[#f7b928]" },
  { type: "wow", emoji: "😮", label: "Me asombra", color: "text-[#f7b928]" },
  { type: "sad", emoji: "😢", label: "Me entristece", color: "text-[#f7b928]" },
  { type: "angry", emoji: "😠", label: "Me enoja", color: "text-[#e9710f]" },
  { type: "care", emoji: "🤗", label: "Me importa", color: "text-[#f7b928]" },
];

const reactionColors: Record<string, string> = {
  like: "text-[#1877f2]",
  love: "text-[#f33e58]",
  haha: "text-[#f7b928]",
  wow: "text-[#f7b928]",
  sad: "text-[#f7b928]",
  angry: "text-[#e9710f]",
  care: "text-[#f7b928]",
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
      className="relative flex-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[14px] font-semibold transition-colors",
          "hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]",
          current
            ? reactionColors[current.type]
            : "text-[#65676b] dark:text-[#b0b3b8]",
        )}
      >
        {current ? (
          <span className="text-[18px] leading-none animate-[bounce_0.3s_ease-in-out]">{current.emoji}</span>
        ) : (
          <ThumbsUp size={18} />
        )}
        <span className="hidden sm:inline">{current?.label ?? "Me gusta"}</span>
      </button>

      {showPicker && (
        <div
          className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-0.5 px-2 py-1.5",
            "bg-white dark:bg-[#242526] rounded-full shadow-xl",
            "border border-[#ced0d4] dark:border-[#3e4042]",
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
                "group flex flex-col items-center p-1 rounded-full",
                "transition-all duration-200 hover:scale-[1.35] hover:-translate-y-1",
              )}
              title={r.label}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span
                className="text-[28px] sm:text-[32px] leading-none cursor-pointer"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {r.emoji}
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold text-[#050505] dark:text-[#e4e6eb] bg-[#050505]/80 dark:bg-[#e4e6eb]/90 text-white dark:text-[#050505] px-2 py-0.5 rounded-full absolute -top-7 whitespace-nowrap pointer-events-none">
                {r.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
