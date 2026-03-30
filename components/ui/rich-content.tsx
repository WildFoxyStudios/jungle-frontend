"use client";

import Link from "next/link";
import { Fragment } from "react";

interface RichContentProps {
  content: string;
  className?: string;
}

/**
 * Renders text content with clickable #hashtags and @mentions.
 * - #hashtag → links to /search?q=%23hashtag
 * - @username → links to /profile/username
 * - URLs → clickable links
 */
export function RichContent({ content, className }: RichContentProps) {
  // Match #hashtags, @mentions, and URLs
  const pattern = /(#[\w\u00C0-\u024F]+)|(@[\w.]+)|(https?:\/\/[^\s]+)/g;

  const parts: Array<{ type: "text" | "hashtag" | "mention" | "url"; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      parts.push({ type: "hashtag", value: match[1] });
    } else if (match[2]) {
      parts.push({ type: "mention", value: match[2] });
    } else if (match[3]) {
      parts.push({ type: "url", value: match[3] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  // If no special content found, return plain text
  if (parts.length === 0) {
    return <span className={className}>{content}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        switch (part.type) {
          case "hashtag":
            return (
              <Link
                key={i}
                href={`/search?q=${encodeURIComponent(part.value)}`}
                className="text-[#1877f2] hover:underline font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {part.value}
              </Link>
            );
          case "mention":
            return (
              <Link
                key={i}
                href={`/profile/${part.value.slice(1)}`}
                className="text-[#1877f2] hover:underline font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {part.value}
              </Link>
            );
          case "url":
            return (
              <a
                key={i}
                href={part.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1877f2] hover:underline break-all"
                onClick={(e) => e.stopPropagation()}
              >
                {part.value.length > 50 ? part.value.slice(0, 50) + "..." : part.value}
              </a>
            );
          default:
            return <Fragment key={i}>{part.value}</Fragment>;
        }
      })}
    </span>
  );
}
