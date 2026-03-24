"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { storiesApi } from "@/lib/api-stories";
import { uploadApi } from "@/lib/api-upload";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { getProxyUrl } from "@/lib/media-proxy";
import type { Story } from "@/lib/types";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

export function StoriesBar() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: stories, loading, refresh } = useApi(() => storiesApi.getStories(), []);

  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [storyText, setStoryText] = useState("");

  const allStories = stories ?? [];

  const openStory = (story: Story) => {
    const idx = allStories.findIndex(s => s.id === story.id);
    setStoryIndex(idx);
    setViewingStory(story);
    storiesApi.viewStory(story.id).catch(() => {});
  };

  const nextStory = () => {
    if (storyIndex < allStories.length - 1) {
      const next = storyIndex + 1;
      setStoryIndex(next);
      setViewingStory(allStories[next]);
    } else {
      setViewingStory(null);
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) {
      const prev = storyIndex - 1;
      setStoryIndex(prev);
      setViewingStory(allStories[prev]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreviewFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setAddOpen(true);
  };

  const uploadStory = async () => {
    if (!previewFile) return;
    setUploading(true);
    try {
      const uploaded = await uploadApi.uploadStoryMedia(previewFile);
      await storiesApi.createStory({
        media_url: uploaded.url,
        media_type: previewFile.type.startsWith("video") ? "video" : "image",
        text_content: storyText || undefined,
        visibility: "friends",
        duration: 15,
      });
      toast.success("Historia publicada");
      setAddOpen(false);
      setPreviewFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setStoryText("");
      refresh();
    } catch {
      toast.error("Error al publicar historia");
    } finally {
      setUploading(false);
    }
  };

  const handleCloseAdd = () => {
    setAddOpen(false);
    setPreviewFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStoryText("");
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
        {/* Add story */}
        <label className="shrink-0 cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileSelect}
          />
          <div className="w-[110px] h-[180px] rounded-2xl overflow-hidden relative bg-slate-100 dark:bg-gray-800 flex flex-col">
            {user?.profile_picture_url ? (
              <div className="flex-1 relative">
                <Image src={user.profile_picture_url} alt="" fill className="object-cover" />
              </div>
            ) : (
              <div className="flex-1 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30" />
            )}
            <div className="bg-white dark:bg-gray-900 py-3 flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center -mt-6 border-2 border-white dark:border-gray-900">
                <Plus size={16} className="text-white" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Tu historia
              </span>
            </div>
          </div>
        </label>

        {/* Skeletons while loading */}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[110px] h-[180px] rounded-2xl skeleton" />
          ))}

        {/* Stories list */}
        {!loading &&
          allStories.map(story => (
            <button
              key={story.id}
              onClick={() => openStory(story)}
              className="shrink-0 w-[110px] h-[180px] rounded-2xl overflow-hidden relative group focus:outline-none"
            >
              {story.media_type === "video" ? (
                <video src={getProxyUrl(story.media_url)} className="w-full h-full object-cover" />
              ) : story.media_url ? (
                <Image
                  src={getProxyUrl(story.media_url)}
                  alt={story.user_name ?? ""}
                  fill
                  className="object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: story.background_color ?? "#4F46E5" }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
              <div className="absolute top-3 left-3">
                <div
                  className={cn(
                    "rounded-full p-0.5",
                    story.has_viewed
                      ? "ring-2 ring-slate-400"
                      : "ring-[2.5px] ring-indigo-500",
                  )}
                >
                  <Avatar
                    src={story.user_picture}
                    alt={story.user_name}
                    size="sm"
                    fallbackName={story.user_name}
                  />
                </div>
              </div>
              {story.text_content && (
                <div className="absolute bottom-8 left-2 right-2">
                  <p className="text-white text-xs font-medium line-clamp-2">
                    {story.text_content}
                  </p>
                </div>
              )}
              <div className="absolute bottom-3 left-0 right-0 px-2">
                <p className="text-white text-[11px] font-semibold text-center truncate">
                  {story.user_id === user?.id ? "Tu historia" : story.user_name}
                </p>
              </div>
            </button>
          ))}
      </div>

      {/* Story Viewer */}
      {viewingStory && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full max-w-sm h-full max-h-[100dvh]">
            {viewingStory.media_type === "video" ? (
              <video
                src={viewingStory.media_url}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
              />
            ) : viewingStory.media_url ? (
              <img
                src={viewingStory.media_url}
                alt=""
                className="w-full h-full object-contain"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{ backgroundColor: viewingStory.background_color ?? "#4F46E5" }}
              />
            )}

            {/* Progress bar */}
            <div className="absolute top-3 left-3 right-3 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: "50%", transition: "width linear 15s" }}
              />
            </div>

            {/* Header */}
            <div className="absolute top-7 left-3 right-3 flex items-center gap-2">
              <Avatar
                src={viewingStory.user_picture}
                alt={viewingStory.user_name}
                size="sm"
                fallbackName={viewingStory.user_name}
              />
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">{viewingStory.user_name}</p>
                <p className="text-white/70 text-xs">hace 2h</p>
              </div>
              <button
                onClick={() => setViewingStory(null)}
                className="text-white p-1 hover:text-white/80 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* Text overlay */}
            {viewingStory.text_content && (
              <div className="absolute inset-x-4 bottom-16 flex items-center justify-center">
                <p className="text-white text-xl font-bold text-center drop-shadow-lg">
                  {viewingStory.text_content}
                </p>
              </div>
            )}

            {/* Navigation */}
            {storyIndex > 0 && (
              <button
                onClick={prevStory}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
            )}
            {storyIndex < allStories.length - 1 && (
              <button
                onClick={nextStory}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add story modal */}
      <Modal
        open={addOpen}
        onClose={handleCloseAdd}
        title="Nueva historia"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseAdd}>
              Cancelar
            </Button>
            <Button onClick={uploadStory} loading={uploading}>
              Publicar historia
            </Button>
          </>
        }
      >
        {previewUrl && (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden aspect-[9/16] max-h-64">
              {previewFile?.type.startsWith("video") ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <img
                  src={previewUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <textarea
              value={storyText}
              onChange={e => setStoryText(e.target.value)}
              placeholder="Agrega texto a tu historia..."
              className="input-base resize-none"
              rows={2}
            />
          </div>
        )}
      </Modal>
    </>
  );
}
