"use client";

import { useState, useRef } from "react";
import { Image, Smile, MapPin, Users, Globe, Lock, ChevronDown, X, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { postsApi } from "@/lib/api-posts";
import { uploadApi } from "@/lib/api-upload";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/types";

const FEELINGS = [
  "😊 Feliz",
  "😍 Enamorado/a",
  "🥳 Celebrando",
  "😎 Genial",
  "😢 Triste",
  "😡 Enojado/a",
  "🤩 Emocionado/a",
  "😴 Cansado/a",
  "🤒 Enfermo/a",
  "🥰 Agradecido/a",
];

const VISIBILITIES = [
  { value: "public", label: "Público", icon: Globe, desc: "Cualquiera puede ver" },
  { value: "friends", label: "Amigos", icon: Users, desc: "Solo tus amigos" },
  { value: "only_me", label: "Solo yo", icon: Lock, desc: "Solo tú puedes ver" },
];

interface CreatePostProps {
  onCreated?: (post: Post) => void;
  groupId?: string;
}

export function CreatePost({ onCreated, groupId }: CreatePostProps) {
  const { user } = useAuth();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [feeling, setFeeling] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const visConfig = VISIBILITIES.find((v) => v.value === visibility) ?? VISIBILITIES[0];

  const handleFiles = (files: FileList | null, type: "image" | "video") => {
    if (!files) return;
    const arr = Array.from(files).slice(0, type === "image" ? 10 : 1);
    setMediaFiles((prev) => [...prev, ...arr]);
    arr.forEach((f) => {
      const url = URL.createObjectURL(f);
      setMediaPreviews((prev) => [...prev, url]);
    });
  };

  const removeMedia = (i: number) => {
    URL.revokeObjectURL(mediaPreviews[i]);
    setMediaFiles((prev) => prev.filter((_, j) => j !== i));
    setMediaPreviews((prev) => prev.filter((_, j) => j !== i));
  };

  const submit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    setLoading(true);
    try {
      let media_urls: string[] = [];
      if (mediaFiles.length > 0) {
        const uploaded = await uploadApi.uploadPostMedia(mediaFiles);
        media_urls = uploaded.map((u) => u.url);
      }
      const post = await postsApi.createPost({
        content: content.trim(),
        media_urls,
        visibility: visibility as "public" | "friends" | "only_me",
        feeling: feeling || undefined,
        group_id: groupId,
      });
      onCreated?.(post);
      setContent("");
      setFeeling("");
      setMediaFiles([]);
      setMediaPreviews([]);
      setOpen(false);
      toast.success("Publicación creada");
    } catch {
      toast.error("Error al publicar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger card */}
      <div className="surface p-4 cursor-pointer" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-3">
          <Avatar
            src={user?.profile_picture_url}
            alt={user?.full_name}
            size="md"
            fallbackName={user?.full_name ?? user?.username}
          />
          <div className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-gray-800 rounded-full text-slate-400 dark:text-slate-500 text-sm hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors select-none">
            ¿Qué estás pensando, {user?.full_name?.split(" ")[0] ?? user?.username}?
          </div>
        </div>

        <hr className="my-3 border-slate-200 dark:border-slate-700" />

        <div className="flex items-center justify-around">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-500 dark:text-slate-400 text-sm font-medium"
          >
            <Video size={18} className="text-red-500" />
            Video en vivo
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); setOpen(true); }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-500 dark:text-slate-400 text-sm font-medium"
          >
            <Image size={18} className="text-green-500" />
            Foto/video
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-500 dark:text-slate-400 text-sm font-medium"
          >
            <Smile size={18} className="text-amber-500" />
            Sentimiento
          </button>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => !loading && setOpen(false)}
        title="Crear publicación"
        size="md"
      >
        <div className="space-y-4">
          {/* User + visibility */}
          <div className="flex items-center gap-3">
            <Avatar
              src={user?.profile_picture_url}
              alt={user?.full_name}
              size="md"
              fallbackName={user?.full_name ?? user?.username}
            />
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
                {user?.full_name}
              </p>
              <button
                className="flex items-center gap-1 text-xs font-medium bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-md px-2 py-0.5 transition-colors text-slate-700 dark:text-slate-300"
                onClick={() => {
                  const idx = VISIBILITIES.findIndex((v) => v.value === visibility);
                  setVisibility(VISIBILITIES[(idx + 1) % VISIBILITIES.length].value);
                }}
              >
                <visConfig.icon size={11} />
                {visConfig.label}
                <ChevronDown size={11} />
              </button>
            </div>
          </div>

          {/* Feeling badge */}
          {feeling && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Se siente {feeling}
              </span>
              <button
                onClick={() => setFeeling("")}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Text */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`¿Qué estás pensando, ${user?.full_name?.split(" ")[0] ?? user?.username}?`}
            className="w-full min-h-[120px] resize-none border-none outline-none text-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 bg-transparent"
            autoFocus
          />

          {/* Media previews */}
          {mediaPreviews.length > 0 && (
            <div
              className={cn(
                "grid gap-1.5 rounded-xl overflow-hidden",
                mediaPreviews.length === 1
                  ? "grid-cols-1"
                  : mediaPreviews.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
              )}
            >
              {mediaPreviews.map((url, i) => (
                <div key={i} className="relative group aspect-square">
                  {mediaFiles[i]?.type.startsWith("video") ? (
                    <video src={url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => removeMedia(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-xl p-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Agregar a tu publicación
            </span>
            <div className="flex items-center gap-1">
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files, "image")}
              />
              <input
                ref={videoRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files, "video")}
              />
              <button
                onClick={() => fileRef.current?.click()}
                title="Fotos"
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-green-500"
              >
                <Image size={20} />
              </button>
              <button
                onClick={() => videoRef.current?.click()}
                title="Video"
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-red-500"
              >
                <Video size={20} />
              </button>
              <button
                title="Sentimiento"
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-amber-500"
                onClick={() => {
                  const f = FEELINGS[Math.floor(Math.random() * FEELINGS.length)];
                  setFeeling(f);
                }}
              >
                <Smile size={20} />
              </button>
              <button
                title="Ubicación"
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-indigo-500"
              >
                <MapPin size={20} />
              </button>
            </div>
          </div>

          <Button
            onClick={submit}
            disabled={!content.trim() && mediaFiles.length === 0}
            loading={loading}
            className="w-full"
            size="lg"
            rounded
          >
            {loading ? "Publicando..." : "Publicar"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
