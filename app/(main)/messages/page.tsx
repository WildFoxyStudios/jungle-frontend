"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  Send,
  Image as ImageIcon,
  Smile,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Check,
  CheckCheck,
  MoreHorizontal,
  X,
  Users,
  Loader2,
  Mic,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { conversationsApi, messagesApi } from "@/lib/api-messages";
import { uploadApi } from "@/lib/api-upload";
import { friendsApi } from "@/lib/api-friends";
import { useApi, useMutation } from "@/hooks/useApi";
import { useRealtime } from "@/contexts/RealtimeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import type { Conversation, Message } from "@/lib/types";

// ─── Helper: format conversation timestamp ────────────────────────────────────

function formatConvTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ayer";
  return format(d, "d MMM", { locale: es });
}

function formatMsgTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  return format(d, "d MMM, HH:mm", { locale: es });
}

function groupMessagesByDate(
  messages: Message[],
): Array<{ label: string; messages: Message[] }> {
  const groups: Record<string, Message[]> = {};
  for (const msg of messages) {
    const d = new Date(msg.created_at);
    const key = isToday(d)
      ? "Hoy"
      : isYesterday(d)
        ? "Ayer"
        : format(d, "EEEE d 'de' MMMM", { locale: es });
    if (!groups[key]) groups[key] = [];
    groups[key].push(msg);
  }
  return Object.entries(groups).map(([label, messages]) => ({
    label,
    messages,
  }));
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activeConvId, setActiveConvId] = useState<string | null>(
    searchParams.get("conv"),
  );
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [convSearch, setConvSearch] = useState("");
  const toast = useToast();

  // ── Conversation list ──────────────────────────────────────────────────────
  const {
    data: conversations,
    loading: loadingConvs,
    refresh: refreshConvs,
  } = useApi(() => conversationsApi.list(), []);

  // ── Real-time: new messages update conversation list ───────────────────────
  const { subscribe } = useRealtime();
  useEffect(() => {
    const unsub = subscribe<
      import("@/contexts/RealtimeContext").WsMessageEvent
    >("message", (_ev) => {
      refreshConvs();
    });
    return unsub;
  }, [subscribe, refreshConvs]);

  const filtered = (conversations ?? []).filter((c) => {
    if (!convSearch.trim()) return true;
    return (
      c.name?.toLowerCase().includes(convSearch.toLowerCase()) ||
      c.participants?.some((p) =>
        p.user_name.toLowerCase().includes(convSearch.toLowerCase()),
      )
    );
  });

  const activeConv = (conversations ?? []).find((c) => c.id === activeConvId);

  // ── Create conversation ────────────────────────────────────────────────────
  const handleNewConversation = async (participantId: string) => {
    try {
      const conv = await conversationsApi.create({
        participant_ids: [participantId],
        is_group: false,
      });
      refreshConvs();
      setActiveConvId(conv.id);
      setNewChatOpen(false);
    } catch {
      toast.error("Error al iniciar la conversación");
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-white dark:bg-gray-900 overflow-hidden">
      {/* ── Sidebar: conversation list ──────────────────────────────────────── */}
      <div
        className={cn(
          "flex flex-col border-r border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900",
          "w-full md:w-[340px] shrink-0",
          // On mobile, hide when a conversation is open
          activeConvId ? "hidden md:flex" : "flex",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-gray-700">
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-50">
            Mensajes
          </h1>
          <button
            onClick={() => setNewChatOpen(true)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-500 dark:text-slate-400"
            title="Nuevo mensaje"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="search"
              placeholder="Buscar conversaciones..."
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 dark:bg-gray-800 rounded-full border border-transparent focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-400 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs &&
            Array.from({ length: 6 }).map((_, i) => (
              <ConversationSkeleton key={i} />
            ))}

          {!loadingConvs && filtered.length === 0 && (
            <EmptyState
              icon={<Users size={28} />}
              title="Sin conversaciones"
              description="Inicia un nuevo chat con un amigo."
              className="py-12"
            />
          )}

          {filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              active={activeConvId === conv.id}
              currentUserId={user?.id ?? ""}
              onClick={() => setActiveConvId(conv.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Main: chat window ──────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex-1 flex flex-col",
          !activeConvId ? "hidden md:flex" : "flex",
        )}
      >
        {activeConvId && activeConv ? (
          <ChatWindow
            conversation={activeConv}
            currentUserId={user?.id ?? ""}
            onBack={() => setActiveConvId(null)}
            onConversationUpdate={refreshConvs}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto">
                <Send size={36} className="text-indigo-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Tus mensajes
              </h2>
              <p className="text-sm text-slate-500 max-w-xs">
                Selecciona una conversación o inicia una nueva.
              </p>
              <Button
                onClick={() => setNewChatOpen(true)}
                leftIcon={<Plus size={16} />}
              >
                Nuevo mensaje
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── New chat modal ─────────────────────────────────────────────────── */}
      <NewChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onSelect={handleNewConversation}
      />
    </div>
  );
}

// ─── Conversation list item ───────────────────────────────────────────────────

function ConversationItem({
  conversation: c,
  active,
  currentUserId,
  onClick,
}: {
  conversation: Conversation;
  active: boolean;
  currentUserId: string;
  onClick: () => void;
}) {
  const otherParticipant = c.participants?.find(
    (p) => p.user_id !== currentUserId,
  );
  const name =
    c.name ??
    otherParticipant?.user_name ??
    (c.is_group ? "Grupo" : "Conversación");
  const avatar = otherParticipant?.user_picture;
  const unread = (c.unread_count ?? 0) > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
        "hover:bg-slate-50 dark:hover:bg-gray-800",
        active && "bg-indigo-50 dark:bg-indigo-900/20",
      )}
    >
      <div className="relative shrink-0">
        <Avatar src={avatar} alt={name} size="md" fallbackName={name} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-sm truncate",
              unread
                ? "font-bold text-slate-900 dark:text-slate-50"
                : "font-medium text-slate-700 dark:text-slate-200",
            )}
          >
            {name}
          </span>
          {c.last_message_at && (
            <span
              className={cn(
                "text-[11px] shrink-0",
                unread
                  ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "text-slate-400",
              )}
            >
              {formatConvTime(c.last_message_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={cn(
              "text-xs truncate",
              unread
                ? "text-slate-700 dark:text-slate-200 font-medium"
                : "text-slate-400 dark:text-slate-500",
            )}
          >
            {c.last_message ?? "Inicia la conversación"}
          </p>
          {unread && (
            <span className="shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-indigo-600 text-white text-[10px] font-bold rounded-full">
              {c.unread_count! > 99 ? "99+" : c.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Chat window ──────────────────────────────────────────────────────────────

function ChatWindow({
  conversation: conv,
  currentUserId,
  onBack,
  onConversationUpdate,
}: {
  conversation: Conversation;
  currentUserId: string;
  onBack: () => void;
  onConversationUpdate: () => void;
}) {
  const toast = useToast();
  const { subscribe, sendTyping } = useRealtime();
  const { notifyTyping, stopTyping } = useTypingIndicator(conv.id);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const otherParticipant = conv.participants?.find(
    (p) => p.user_id !== currentUserId,
  );
  const chatName =
    conv.name ??
    otherParticipant?.user_name ??
    (conv.is_group ? "Grupo" : "Conversación");

  // ── Load messages ──────────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingMsgs(true);
    conversationsApi
      .getMessages(conv.id)
      .then((msgs) => {
        setMessages(msgs);
      })
      .catch(() => toast.error("Error al cargar mensajes"))
      .finally(() => setLoadingMsgs(false));

    // Mark as read
    conversationsApi.markAsRead(conv.id).catch(() => {});
    onConversationUpdate();
  }, [conv.id]);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Real-time message subscription ────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribe<
      import("@/contexts/RealtimeContext").WsMessageEvent
    >("message", (ev) => {
      if (ev.data.conversation_id === conv.id) {
        const newMsg: Message = {
          id: ev.data.id,
          conversation_id: ev.data.conversation_id,
          sender_id: ev.data.sender_id,
          sender_name: ev.data.sender_name,
          content: ev.data.content,
          media_url: undefined,
          message_type: ev.data.message_type,
          is_edited: false,
          created_at: ev.data.created_at,
          updated_at: ev.data.created_at,
        };
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        // Mark as read if window is focused
        if (document.hasFocus()) {
          conversationsApi.markAsRead(conv.id).catch(() => {});
        }
      }
    });
    return unsub;
  }, [subscribe, conv.id]);

  // ── Typing indicator subscription ─────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribe<import("@/contexts/RealtimeContext").WsTypingEvent>(
      "typing",
      (ev) => {
        if (
          ev.data.conversation_id === conv.id &&
          ev.data.user_id !== currentUserId
        ) {
          setOtherTyping(ev.data.is_typing);
          if (ev.data.is_typing) {
            if (typingTimeout) clearTimeout(typingTimeout);
            const t = setTimeout(() => setOtherTyping(false), 3000);
            setTypingTimeout(t);
          }
        }
      },
    );
    return unsub;
  }, [subscribe, conv.id, currentUserId]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (
    msgContent: string,
    mediaUrl?: string,
    msgType = "text",
  ) => {
    if (!msgContent.trim() && !mediaUrl) return;
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      conversation_id: conv.id,
      sender_id: currentUserId,
      content: msgContent,
      media_url: mediaUrl,
      message_type: msgType,
      is_edited: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setContent("");
    stopTyping();
    setSending(true);

    try {
      const sent = await conversationsApi.sendMessage(conv.id, {
        content: msgContent || undefined,
        media_url: mediaUrl,
        message_type: msgType,
      });
      // Replace optimistic with real
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? sent : m)),
      );
      onConversationUpdate();
    } catch {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      toast.error("Error al enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) sendMessage(content.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (content.trim()) sendMessage(content.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    notifyTyping();
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const uploaded = await uploadApi.uploadMessageAttachment(file);
      const type = file.type.startsWith("image/") ? "image" : "file";
      await sendMessage("", uploaded.url, type);
    } catch {
      toast.error("Error al subir el archivo");
    }
  };

  // ── Delete message ─────────────────────────────────────────────────────────
  const handleDelete = async (msgId: string) => {
    try {
      await messagesApi.delete(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch {
      toast.error("Error al eliminar el mensaje");
    }
  };

  const grouped = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-2 -ml-1 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar
            src={otherParticipant?.user_picture}
            alt={chatName}
            size="md"
            fallbackName={chatName}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">
              {chatName}
            </p>
            <p className="text-xs text-slate-400">
              {otherTyping ? (
                <span className="text-indigo-500 font-medium animate-pulse">
                  Escribiendo...
                </span>
              ) : (
                "En línea"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-500 dark:text-slate-400">
            <Phone size={18} />
          </button>
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-500 dark:text-slate-400">
            <Video size={18} />
          </button>
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-500 dark:text-slate-400">
            <Info size={18} />
          </button>
        </div>
      </div>

      {/* ── Messages area ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-slate-50 dark:bg-gray-950">
        {loadingMsgs && (
          <div className="flex flex-col gap-3 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <MessageSkeleton key={i} mine={i % 3 === 0} />
            ))}
          </div>
        )}

        {!loadingMsgs && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <Avatar
                src={otherParticipant?.user_picture}
                alt={chatName}
                size="2xl"
                fallbackName={chatName}
                className="mx-auto"
              />
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {chatName}
              </p>
              <p className="text-sm text-slate-500">
                Dí hola para iniciar la conversación 👋
              </p>
            </div>
          </div>
        )}

        {grouped.map(({ label, messages: group }) => (
          <div key={label}>
            {/* Date divider */}
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs font-medium text-slate-400 shrink-0">
                {label}
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Messages */}
            {group.map((msg, idx) => {
              const isMine = msg.sender_id === currentUserId;
              const prevMsg = idx > 0 ? group[idx - 1] : null;
              const isConsecutive =
                prevMsg?.sender_id === msg.sender_id &&
                new Date(msg.created_at).getTime() -
                  new Date(prevMsg.created_at).getTime() <
                  120_000;

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={isMine}
                  consecutive={isConsecutive}
                  onDelete={isMine ? () => handleDelete(msg.id) : undefined}
                />
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {otherTyping && (
          <div className="flex items-end gap-2 animate-fade-in">
            <Avatar
              src={otherParticipant?.user_picture}
              alt={chatName}
              size="xs"
              fallbackName={chatName}
            />
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm border border-slate-200 dark:border-gray-700">
              <div className="flex gap-1 items-center">
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ──────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-t border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Media button */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="p-2 rounded-full text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors shrink-0"
            title="Adjuntar archivo"
          >
            <ImageIcon size={20} />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Aa"
              value={content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 rounded-full text-sm outline-none focus:bg-white dark:focus:bg-gray-700 border border-transparent focus:border-indigo-400 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Emoji */}
          <button
            type="button"
            className="p-2 rounded-full text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors shrink-0"
            title="Emoji"
          >
            <Smile size={20} />
          </button>

          {/* Send / mic */}
          {content.trim() ? (
            <button
              type="submit"
              disabled={sending}
              className={cn(
                "p-2.5 rounded-full transition-all shrink-0",
                "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95",
                "shadow-md hover:shadow-indigo-200 dark:hover:shadow-indigo-900/50",
                sending && "opacity-70",
              )}
            >
              {sending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          ) : (
            <button
              type="button"
              className="p-2 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors shrink-0"
              title="Mensaje de voz"
            >
              <Mic size={20} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message: msg,
  isMine,
  consecutive,
  onDelete,
}: {
  message: Message;
  isMine: boolean;
  consecutive: boolean;
  onDelete?: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isOptimistic = msg.id.startsWith("opt-");

  return (
    <div
      className={cn(
        "flex items-end gap-2 group",
        isMine ? "flex-row-reverse" : "flex-row",
        consecutive ? "mt-0.5" : "mt-3",
      )}
    >
      {/* Avatar (only for others, only for first in group) */}
      {!isMine && (
        <div className={cn("shrink-0 w-7", consecutive ? "invisible" : "")}>
          <Avatar
            src={undefined}
            alt={msg.sender_name ?? ""}
            size="xs"
            fallbackName={msg.sender_name ?? ""}
          />
        </div>
      )}

      {/* Bubble */}
      <div className="relative max-w-[70%]">
        {/* Delete menu */}
        {onDelete && (
          <div
            className={cn(
              "absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isMine ? "-left-8" : "-right-8",
            )}
          >
            <button
              onClick={onDelete}
              className="p-1 rounded-full bg-slate-200 dark:bg-gray-700 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Eliminar"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Image message */}
        {msg.message_type === "image" && msg.media_url ? (
          <div
            className={cn(
              "rounded-2xl overflow-hidden",
              isMine ? "rounded-br-sm" : "rounded-bl-sm",
            )}
          >
            <img
              src={msg.media_url}
              alt="Imagen"
              className="max-w-[240px] max-h-[300px] object-cover cursor-pointer hover:brightness-90 transition-all"
              loading="lazy"
            />
          </div>
        ) : (
          /* Text message */
          <div
            className={cn(
              "px-3.5 py-2 text-sm",
              isMine
                ? [
                    "bg-indigo-600 text-white rounded-2xl rounded-br-sm",
                    isOptimistic && "opacity-70",
                  ]
                : "bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-sm border border-slate-200 dark:border-gray-700 shadow-sm",
            )}
          >
            {msg.content && (
              <p className="whitespace-pre-wrap break-words leading-relaxed">
                {msg.content}
              </p>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            "flex items-center gap-1 mt-0.5",
            isMine ? "justify-end" : "justify-start",
          )}
        >
          <span className="text-[10px] text-slate-400">
            {formatMsgTime(msg.created_at)}
          </span>
          {isMine && (
            <span className="text-[10px] text-slate-400">
              {isOptimistic ? (
                <Loader2 size={10} className="animate-spin inline" />
              ) : (
                <CheckCheck size={12} className="inline text-indigo-400" />
              )}
            </span>
          )}
          {msg.is_edited && (
            <span className="text-[10px] text-slate-400 italic">editado</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── New chat modal ────────────────────────────────────────────────────────────

function NewChatModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (userId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data: friends, loading } = useApi(
    () => friendsApi.getFriends({ limit: 50 }),
    [],
  );

  const filtered = (friends ?? []).filter(
    (f) =>
      !debouncedSearch ||
      f.full_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      f.username.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  return (
    <Modal open={open} onClose={onClose} title="Nuevo mensaje" size="sm">
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="search"
            placeholder="Buscar amigos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9"
            autoFocus
          />
        </div>

        {/* Friends list */}
        <div className="max-h-[340px] overflow-y-auto space-y-0.5 -mx-1 px-1">
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="w-10 h-10 shrink-0" rounded />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            ))}

          {!loading && filtered.length === 0 && (
            <EmptyState
              title="Sin resultados"
              description="No encontramos amigos con ese nombre."
              className="py-8"
            />
          )}

          {!loading &&
            filtered.map((friend) => (
              <button
                key={friend.id}
                onClick={() => onSelect(friend.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <Avatar
                  src={friend.profile_picture_url}
                  alt={friend.full_name}
                  size="md"
                  fallbackName={friend.full_name}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {friend.full_name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    @{friend.username}
                  </p>
                </div>
              </button>
            ))}
        </div>
      </div>
    </Modal>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-11 h-11 shrink-0" rounded />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2.5 w-10" />
        </div>
        <Skeleton className="h-2.5 w-40" />
      </div>
    </div>
  );
}

function MessageSkeleton({ mine }: { mine: boolean }) {
  return (
    <div className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
      {!mine && <Skeleton className="w-7 h-7 shrink-0" rounded />}
      <Skeleton
        className={cn(
          "h-9 rounded-2xl",
          mine ? "w-36 rounded-br-sm" : "w-44 rounded-bl-sm",
        )}
      />
    </div>
  );
}
