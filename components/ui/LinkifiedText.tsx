"use client";

import { useMemo, useCallback } from "react";
import { parseLinkifiedText, LinkifiedTextOptions, LinkifiedPart } from "@/lib/linkification";

interface LinkifiedTextComponentProps {
  text: string;
  options?: LinkifiedTextOptions & {
    onMentionClick?: (username: string) => void;
    onHashtagClick?: (hashtag: string) => void;
  };
}

export function LinkifiedText({ text, options = {} }: LinkifiedTextComponentProps) {
  const parts = useMemo(() => parseLinkifiedText(text, options), [text, options]);

  const {
    openInNewTab = true,
    onMentionClick,
    onHashtagClick,
    classNames = {},
  } = options;

  const handleMentionClick = useCallback(
    (e: React.MouseEvent, username: string) => {
      if (onMentionClick) {
        e.preventDefault();
        onMentionClick(username);
      }
    },
    [onMentionClick]
  );

  const handleHashtagClick = useCallback(
    (e: React.MouseEvent, hashtag: string) => {
      if (onHashtagClick) {
        e.preventDefault();
        onHashtagClick(hashtag);
      }
    },
    [onHashtagClick]
  );

  const renderPart = (part: LinkifiedPart, index: number) => {
    switch (part.type) {
      case "url":
        return (
          <a
            key={index}
            href={part.href}
            className={classNames.url || "text-indigo-600 hover:underline break-all"}
            target={openInNewTab ? "_blank" : undefined}
            rel={openInNewTab ? "noopener noreferrer" : undefined}
          >
            {part.content}
          </a>
        );

      case "email":
        return (
          <a
            key={index}
            href={part.href}
            className={classNames.email || "text-indigo-600 hover:underline"}
          >
            {part.content}
          </a>
        );

      case "mention": {
        const username = part.content.slice(1);
        return (
          <a
            key={index}
            href={part.href}
            onClick={(e) => handleMentionClick(e, username)}
            className={classNames.mention || "text-indigo-600 hover:underline font-medium"}
          >
            {part.content}
          </a>
        );
      }

      case "hashtag": {
        const hashtag = part.content.slice(1);
        return (
          <a
            key={index}
            href={part.href}
            onClick={(e) => handleHashtagClick(e, hashtag)}
            className={classNames.hashtag || "text-indigo-600 hover:underline font-medium"}
          >
            {part.content}
          </a>
        );
      }

      case "text":
      default:
        return (
          <span key={index} className="whitespace-pre-wrap">
            {part.content.split("\n").map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </span>
        );
    }
  };

  return <>{parts.map(renderPart)}</>;
}

export default LinkifiedText;
