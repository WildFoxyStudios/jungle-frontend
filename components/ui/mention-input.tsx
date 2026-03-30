"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { searchApi } from "@/lib/api-search";
import { hashtagsApi } from "@/lib/api-hashtags";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Hash, AtSign } from "lucide-react";

interface Suggestion {
  id: string;
  type: "user" | "hashtag";
  label: string;
  subtitle?: string;
  picture?: string;
  insertText: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
}

export function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Escribe algo...",
  className,
  inputClassName,
  disabled = false,
  autoFocus = false,
  multiline = false,
  rows = 1,
  maxLength,
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerInfo, setTriggerInfo] = useState<{ type: "@" | "#"; start: number; query: string } | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Detect @ or # trigger while typing
  const detectTrigger = useCallback((text: string, cursorPos: number) => {
    const before = text.slice(0, cursorPos);
    // Find the last @ or # that starts a mention/hashtag
    const atMatch = before.match(/@(\w{0,30})$/);
    const hashMatch = before.match(/#(\w{0,30})$/);

    if (atMatch && atMatch.index !== undefined) {
      return { type: "@" as const, start: atMatch.index, query: atMatch[1] };
    }
    if (hashMatch && hashMatch.index !== undefined) {
      return { type: "#" as const, start: hashMatch.index, query: hashMatch[1] };
    }
    return null;
  }, []);

  const fetchSuggestions = useCallback(async (type: "@" | "#", query: string) => {
    if (query.length < 1) { setSuggestions([]); return; }
    setLoading(true);
    try {
      if (type === "@") {
        const result = await searchApi.autocomplete({ q: query, limit: 6 });
        const users: Suggestion[] = (result.users ?? []).map((u: any) => ({
          id: u.id,
          type: "user",
          label: u.full_name || u.username,
          subtitle: `@${u.username}`,
          picture: u.profile_picture_url,
          insertText: `@${u.username} `,
        }));
        setSuggestions(users);
      } else {
        const hashtags = await hashtagsApi.search({ q: query, limit: 6 });
        const items: Suggestion[] = hashtags.map((h: any) => ({
          id: h.id || h.name,
          type: "hashtag",
          label: `#${h.name}`,
          subtitle: h.posts_count ? `${h.posts_count} publicaciones` : undefined,
          insertText: `#${h.name} `,
        }));
        setSuggestions(items);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    const el = inputRef.current;
    if (!el) return;
    const cursorPos = el.selectionStart ?? newValue.length;
    const trigger = detectTrigger(newValue, cursorPos);
    setTriggerInfo(trigger);

    if (trigger && trigger.query.length >= 1) {
      setShowDropdown(true);
      setSelectedIndex(0);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchSuggestions(trigger.type, trigger.query), 200);
    } else {
      setShowDropdown(false);
      setSuggestions([]);
    }
  };

  const insertSuggestion = (suggestion: Suggestion) => {
    if (!triggerInfo) return;
    const before = value.slice(0, triggerInfo.start);
    const el = inputRef.current;
    const cursorPos = el?.selectionStart ?? value.length;
    const after = value.slice(cursorPos);
    const newValue = before + suggestion.insertText + after;
    onChange(newValue);
    setShowDropdown(false);
    setSuggestions([]);
    setTriggerInfo(null);
    // Focus back and set cursor after inserted text
    setTimeout(() => {
      if (el) {
        el.focus();
        const newPos = before.length + suggestion.insertText.length;
        el.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (showDropdown && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertSuggestion(suggestions[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        setShowDropdown(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey && !showDropdown && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const InputComponent = multiline ? "textarea" : "input";

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <InputComponent
        ref={inputRef as any}
        value={value}
        onChange={(e: any) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        {...(multiline ? { rows } : {})}
        className={cn(
          "w-full bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400",
          inputClassName,
        )}
      />

      {/* Suggestions dropdown */}
      {showDropdown && (suggestions.length > 0 || loading) && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 overflow-hidden z-50 max-h-[240px] overflow-y-auto">
          {loading && suggestions.length === 0 && (
            <div className="flex items-center justify-center py-3">
              <Spinner size="sm" />
            </div>
          )}
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              onClick={() => insertSuggestion(s)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                i === selectedIndex
                  ? "bg-indigo-50 dark:bg-indigo-900/20"
                  : "hover:bg-slate-50 dark:hover:bg-gray-700",
              )}
            >
              {s.type === "user" ? (
                <Avatar src={s.picture} alt={s.label} size="sm" fallbackName={s.label} />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <Hash size={14} className="text-slate-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{s.label}</p>
                {s.subtitle && <p className="text-xs text-slate-500 truncate">{s.subtitle}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
