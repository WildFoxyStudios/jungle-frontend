"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Video,
  Users,
  Eye,
  MessageCircle,
  Heart,
  Share2,
  Mic,
  MicOff,
  VideoOff,
  Settings,
  X,
  Send,
  Plus,
  Radio,
  Loader2,
  ChevronRight,
  Flame,
  Clock,
} from "lucide-react";
import { streamingApi } from "@/lib/api-streaming";
import { useApi, useInfiniteApi } from "@/hooks/useApi";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { LiveStream, StreamComment } from "@/lib/types";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LivePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [goLiveOpen, setGoLiveOpen] = useState(false);
  const [watchingStream, setWatchingStream] = useState<LiveStream | null>(null);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shadow-sm">
            <Radio size={22} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
              En Vivo
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Transmisiones en tiempo real
            </p>
          </div>
        </div>
        <Button
          className="bg-red-600 hover:bg-red-700 text-white border-0"
          leftIcon={<Video size={16} />}
          onClick={() => setGoLiveOpen(true)}
        >
          Transmitir en vivo
        </Button>
      </div>

      <Tabs defaultTab="live">
        <div className="surface mb-5">
          <TabList className="px-2">
            <Tab value="live">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                En vivo ahora
              </span>
            </Tab>
            <Tab value="upcoming">Próximas</Tab>
            <Tab value="recorded">Grabaciones</Tab>
          </TabList>
        </div>

        <TabPanel value="live">
          <LiveNowTab onWatch={setWatchingStream} />
        </TabPanel>
        <TabPanel value="upcoming">
          <UpcomingTab />
        </TabPanel>
        <TabPanel value="recorded">
          <EmptyState
            icon={<Video size={32} />}
            title="Sin grabaciones"
            description="Las transmisiones grabadas aparecerán aquí próximamente."
            className="py-16"
          />
        </TabPanel>
      </Tabs>

      {/* Go live modal */}
      <GoLiveModal open={goLiveOpen} onClose={() => setGoLiveOpen(false)} />

      {/* Watch stream modal */}
      {watchingStream && (
        <WatchStreamModal
          stream={watchingStream}
          onClose={() => setWatchingStream(null)}
        />
      )}
    </div>
  );
}

// ─── Live Now tab ─────────────────────────────────────────────────────────────

function LiveNowTab({ onWatch }: { onWatch: (s: LiveStream) => void }) {
  const { data: streams, loading } = useApi(() => streamingApi.getLive(), []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <StreamCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!streams || streams.length === 0) {
    return (
      <EmptyState
        icon={
          <div className="relative">
            <Radio size={40} />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse border-2 border-white dark:border-gray-900" />
          </div>
        }
        title="Nadie está transmitiendo ahora"
        description="Sé el primero en iniciar una transmisión en vivo para tu comunidad."
        className="py-20"
      />
    );
  }

  // Sort by viewers descending
  const sorted = [...streams].sort((a, b) => b.viewers_count - a.viewers_count);

  return (
    <div className="space-y-6">
      {/* Featured stream */}
      {sorted[0] && (
        <div className="surface overflow-hidden">
          <div
            className="relative cursor-pointer group"
            onClick={() => onWatch(sorted[0])}
          >
            <div className="aspect-video bg-gradient-to-br from-slate-900 to-indigo-900 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Video size={32} className="text-white ml-1" />
                </div>
              </div>
              {/* Live badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-full shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  EN VIVO
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur text-white text-sm font-medium rounded-full">
                  <Eye size={14} />
                  {sorted[0].viewers_count.toLocaleString()} espectadores
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-4">
                <Avatar
                  src={sorted[0].streamer_picture}
                  alt={sorted[0].streamer_name}
                  size="lg"
                  fallbackName={sorted[0].streamer_name}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {sorted[0].title}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {sorted[0].streamer_name}
                  </p>
                  {sorted[0].started_at && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock size={12} />
                      Transmitiendo desde{" "}
                      {formatDistanceToNow(new Date(sorted[0].started_at), {
                        addSuffix: false,
                        locale: es,
                      })}
                    </p>
                  )}
                </div>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white border-0 shrink-0"
                  leftIcon={<Eye size={15} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onWatch(sorted[0]);
                  }}
                >
                  Ver ahora
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other streams grid */}
      {sorted.length > 1 && (
        <div>
          <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Flame size={18} className="text-orange-500" />
            Más transmisiones
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.slice(1).map((stream, i) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                index={i}
                onWatch={() => onWatch(stream)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upcoming tab ─────────────────────────────────────────────────────────────

function UpcomingTab() {
  return (
    <EmptyState
      icon={<Clock size={32} />}
      title="Sin transmisiones programadas"
      description="Cuando los creadores programen transmisiones, aparecerán aquí."
      className="py-16"
    />
  );
}

// ─── Stream card ──────────────────────────────────────────────────────────────

function StreamCard({
  stream,
  index,
  onWatch,
}: {
  stream: LiveStream;
  index: number;
  onWatch: () => void;
}) {
  return (
    <div
      className={cn(
        "surface overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group animate-fade-in-up",
        `stagger-${(index % 5) + 1}`,
      )}
      onClick={onWatch}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-indigo-900 overflow-hidden">
        {stream.thumbnail_url ? (
          <img
            src={stream.thumbnail_url}
            alt={stream.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video size={36} className="text-white/20" />
          </div>
        )}
        {/* Live overlay */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white text-[11px] font-bold rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            EN VIVO
          </span>
        </div>
        {/* Viewers */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur text-white text-[11px] font-medium rounded-full">
          <Eye size={11} />
          {stream.viewers_count.toLocaleString()}
        </div>
        {/* Play button on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
            <Video size={20} className="text-slate-900" />
          </div>
        </div>
      </div>
      {/* Info */}
      <div className="p-3 flex gap-3">
        <Avatar
          src={stream.streamer_picture}
          alt={stream.streamer_name}
          size="sm"
          fallbackName={stream.streamer_name}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {stream.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {stream.streamer_name}
          </p>
          {stream.started_at && (
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Clock size={10} />
              {formatDistanceToNow(new Date(stream.started_at), {
                locale: es,
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Watch stream modal ───────────────────────────────────────────────────────

function WatchStreamModal({
  stream,
  onClose,
}: {
  stream: LiveStream;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState<StreamComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Join on mount, leave on unmount
  useEffect(() => {
    streamingApi.join(stream.id).catch(() => {});
    streamingApi
      .getComments(stream.id)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoadingComments(false));

    streamingApi
      .getReactions(stream.id)
      .then((r) => {
        const map: Record<string, number> = {};
        r.forEach((item) => {
          if (item.reaction_type) map[item.reaction_type] = item.count;
        });
        setReactions(map);
      })
      .catch(() => {});

    return () => {
      streamingApi.leave(stream.id).catch(() => {});
    };
  }, [stream.id]);

  // Auto-scroll comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const c = await streamingApi.comment(stream.id, {
        content: commentText.trim(),
      });
      setComments((prev) => [...prev, c]);
      setCommentText("");
    } catch {
      toast.error("Error al enviar el comentario");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (type: string) => {
    try {
      await streamingApi.react(stream.id, { reaction_type: type });
      setReactions((prev) => ({
        ...prev,
        [type]: (prev[type] ?? 0) + 1,
      }));
    } catch {}
  };

  const REACTION_EMOJIS = ["❤️", "😂", "😮", "👏", "🔥", "💯"];
  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      hideClose={false}
      className="!p-0 overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row h-[80vh]">
        {/* Video area */}
        <div className="flex-1 bg-black relative flex items-center justify-center">
          {stream.hls_url ? (
            <video
              src={stream.hls_url}
              className="w-full h-full object-contain"
              autoPlay
              controls
              playsInline
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-white/60">
              <Video size={56} />
              <p className="text-sm">Conectando a la transmisión...</p>
            </div>
          )}
          {/* Stream info overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-full shadow">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                EN VIVO
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur text-white text-sm rounded-full">
                <Eye size={14} />
                {stream.viewers_count.toLocaleString()}
              </span>
            </div>
          </div>
          {/* Reactions bar */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="text-2xl hover:scale-125 active:scale-90 transition-transform"
                title={`Reaccionar con ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            {totalReactions > 0 && (
              <span className="text-white/70 text-sm font-medium ml-1">
                {totalReactions.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className="w-full lg:w-80 flex flex-col bg-white dark:bg-gray-900 border-l border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <Avatar
                src={stream.streamer_picture}
                alt={stream.streamer_name}
                size="md"
                fallbackName={stream.streamer_name}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 dark:text-slate-50 truncate">
                  {stream.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {stream.streamer_name}
                </p>
              </div>
            </div>
            {/* Share */}
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Enlace copiado");
              }}
              className="flex items-center gap-1.5 mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              <Share2 size={12} />
              Compartir transmisión
            </button>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {loadingComments ? (
              <div className="flex justify-center py-6">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">
                ¡Sé el primero en comentar! 💬
              </p>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-2 animate-fade-in"
                >
                  <Avatar
                    src={c.user_picture}
                    alt={c.user_name}
                    size="xs"
                    fallbackName={c.user_name ?? ""}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {c.user_name ?? "Usuario"}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 ml-1.5">
                      {c.content}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment input */}
          <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Avatar
                src={user?.profile_picture_url}
                alt={user?.full_name}
                size="xs"
                fallbackName={user?.full_name ?? user?.username ?? ""}
              />
              <input
                type="text"
                placeholder="Escribe un comentario..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleComment();
                  }
                }}
                className="flex-1 px-3 py-2 text-sm bg-slate-100 dark:bg-gray-800 rounded-full outline-none focus:bg-white dark:focus:bg-gray-700 border border-transparent focus:border-indigo-400 transition-all placeholder:text-slate-400"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || submitting}
                className={cn(
                  "p-2 rounded-full transition-all shrink-0",
                  commentText.trim()
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                    : "text-slate-300 dark:text-slate-600 cursor-not-allowed",
                )}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Go live modal ────────────────────────────────────────────────────────────

function GoLiveModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const [step, setStep] = useState<"setup" | "live">("setup");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [starting, setStarting] = useState(false);
  const [liveStream, setLiveStream] = useState<LiveStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [ending, setEnding] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera
  useEffect(() => {
    if (open) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
          toast.error("No se pudo acceder a la cámara o micrófono");
        });
    }

    return () => {
      // Cleanup tracks on unmount or close
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open, toast]);

  // Handle toggles
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = camEnabled;
      });
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = micEnabled;
      });
    }
  }, [camEnabled, micEnabled]);

  const handleStartLive = async () => {
    if (!title.trim()) return;
    setStarting(true);
    try {
      const stream = await streamingApi.create({
        title: title.trim(),
        description: description || undefined,
      });
      // Start the stream
      await streamingApi.start(stream.id);
      setLiveStream(stream);
      setStep("live");
      toast.success("¡Estás en vivo!");
    } catch {
      toast.error("Error al iniciar la transmisión");
    } finally {
      setStarting(false);
    }
  };

  const handleEndLive = async () => {
    if (!liveStream) return;
    if (!confirm("¿Terminar la transmisión en vivo?")) return;
    setEnding(true);
    try {
      await streamingApi.end(liveStream.id);
      toast.info("Transmisión finalizada");
      onClose();
      setStep("setup");
      setLiveStream(null);
      setTitle("");
      setDescription("");
    } catch {
      toast.error("Error al finalizar la transmisión");
    } finally {
      setEnding(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (step === "live") return; // prevent closing while live
        onClose();
      }}
      title={step === "setup" ? "Iniciar transmisión en vivo" : "En vivo ahora"}
      size="md"
      hideClose={step === "live"}
    >
      {step === "setup" ? (
        <div className="space-y-5">
          {/* Camera preview placeholder */}
          <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={cn(
                "w-full h-full object-cover",
                !camEnabled && "hidden"
              )}
            />
            {!camEnabled && <VideoOff size={48} className="text-white/20" />}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMicEnabled((v) => !v)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    micEnabled
                      ? "bg-white/20 text-white hover:bg-white/30"
                      : "bg-red-600 text-white",
                  )}
                  title={
                    micEnabled ? "Silenciar micrófono" : "Activar micrófono"
                  }
                >
                  {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button
                  onClick={() => setCamEnabled((v) => !v)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    camEnabled
                      ? "bg-white/20 text-white hover:bg-white/30"
                      : "bg-red-600 text-white",
                  )}
                  title={camEnabled ? "Apagar cámara" : "Activar cámara"}
                >
                  {camEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
              </div>
              <button className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Título de la transmisión <span className="text-red-500">*</span>
            </label>
            <input
              className="input-base"
              placeholder="¿De qué tratará tu transmisión?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Descripción (opcional)
            </label>
            <textarea
              className="input-base resize-none"
              rows={2}
              placeholder="Cuéntale a tu audiencia de qué tratará..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
            <Radio size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">
              Tu transmisión será visible para todos los usuarios de la
              plataforma. Asegúrate de tener buena iluminación y conexión a
              internet estable.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
              leftIcon={<Radio size={16} />}
              onClick={handleStartLive}
              loading={starting}
              disabled={!title.trim()}
            >
              Iniciar transmisión
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Live indicator */}
          <div className="flex items-center justify-center gap-3 p-5 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-900/40">
            <span className="w-4 h-4 rounded-full bg-red-600 animate-pulse shadow-lg shadow-red-500/50" />
            <div className="text-center">
              <p className="text-xl font-black text-red-700 dark:text-red-400">
                TRANSMITIENDO EN VIVO
              </p>
              <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-0.5">
                {liveStream?.title}
              </p>
            </div>
          </div>

          <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={cn(
                "w-full h-full object-cover",
                !camEnabled && "hidden"
              )}
            />
            {!camEnabled && (
              <div className="absolute inset-0 flex items-center justify-center">
                <VideoOff size={48} className="text-white/20" />
              </div>
            )}
          </div>

          {/* Live stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="surface p-4 text-center">
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {liveStream?.viewers_count ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                <Eye size={11} />
                Espectadores
              </p>
            </div>
            <div className="surface p-4 text-center">
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {liveStream?.peak_viewers ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Pico de espectadores
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 py-2">
            <button
              onClick={() => setMicEnabled((v) => !v)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md",
                micEnabled
                  ? "bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-gray-600"
                  : "bg-red-600 text-white shadow-red-200 dark:shadow-red-900/50",
              )}
            >
              {micEnabled ? <Mic size={22} /> : <MicOff size={22} />}
            </button>
            <button
              onClick={() => setCamEnabled((v) => !v)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md",
                camEnabled
                  ? "bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-gray-600"
                  : "bg-red-600 text-white shadow-red-200 dark:shadow-red-900/50",
              )}
            >
              {camEnabled ? <Video size={22} /> : <VideoOff size={22} />}
            </button>
          </div>

          {/* End button */}
          <Button
            className="w-full bg-red-600 hover:bg-red-700 text-white border-0"
            leftIcon={<X size={16} />}
            onClick={handleEndLive}
            loading={ending}
            size="lg"
          >
            Finalizar transmisión
          </Button>

          <p className="text-center text-xs text-slate-400">
            Los datos de tu transmisión se guardarán automáticamente al
            finalizar
          </p>
        </div>
      )}
    </Modal>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StreamCardSkeleton() {
  return (
    <div className="surface overflow-hidden">
      <Skeleton className="aspect-video rounded-none" />
      <div className="p-3 flex gap-3">
        <Skeleton className="w-9 h-9 shrink-0" rounded />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}
