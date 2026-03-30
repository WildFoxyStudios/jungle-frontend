"use client";

import { useState, useCallback } from "react";
import { Play, Plus, Radio, Film, Tv } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { WatchSidebar, SIDEBAR_SECTIONS } from "@/components/watch/WatchSidebar";
import { SearchBar } from "@/components/watch/SearchBar";
import { CategoryChips } from "@/components/watch/CategoryChips";
import { ExpandedPlayer } from "@/components/watch/ExpandedPlayer";
import { UploadVideoModal } from "@/components/watch/UploadVideoModal";
import { VideoFeed } from "@/components/watch/VideoFeed";
import { SubscriptionFeed } from "@/components/watch/SubscriptionFeed";
import { SavedFeed } from "@/components/watch/SavedFeed";
import type { WatchSection } from "@/components/watch/WatchSidebar";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WatchPage() {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState<WatchSection>("home");
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const handleVideoExpand = useCallback((videoId: string) => {
    setExpandedVideoId(videoId);
  }, []);

  const handleCloseExpanded = useCallback(() => {
    setExpandedVideoId(null);
  }, []);

  const handleCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
    window.dispatchEvent(new CustomEvent("refresh-watch-feed"));
    toast.success("¡Video publicado!");
  }, [toast]);

  // Render the content area based on active section
  const renderContent = () => {
    // If a video is expanded, show the ExpandedPlayer regardless of section
    if (expandedVideoId) {
      return (
        <ExpandedPlayer
          videoId={expandedVideoId}
          onClose={handleCloseExpanded}
        />
      );
    }

    switch (activeSection) {
      case "home":
        return (
          <VideoFeed
            key={`home-${refreshKey}`}
            searchQuery={debouncedSearch}
            selectedCategory={selectedCategory}
            onVideoExpand={handleVideoExpand}
          />
        );

      case "saved":
        return (
          <SavedFeed
            key={`saved-${refreshKey}`}
            onVideoExpand={handleVideoExpand}
          />
        );

      case "following":
        return (
          <SubscriptionFeed
            key={`following-${refreshKey}`}
            onVideoExpand={handleVideoExpand}
          />
        );

      case "live":
        return (
          <EmptyState
            icon={<Radio size={28} />}
            title="En vivo"
            description="Las transmisiones en vivo estarán disponibles próximamente."
          />
        );

      case "reels":
        return (
          <EmptyState
            icon={<Film size={28} />}
            title="Reels"
            description="Los Reels estarán disponibles próximamente."
          />
        );

      case "shows":
        return (
          <EmptyState
            icon={<Tv size={28} />}
            title="Shows"
            description="Los Shows estarán disponibles próximamente."
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Sidebar — hidden on mobile */}
      <WatchSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main area */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* Mobile horizontal nav */}
        <div className="flex md:hidden overflow-x-auto no-scrollbar gap-1 px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900">
          {SIDEBAR_SECTIONS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors",
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400",
                )}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="max-w-[900px] mx-auto px-4 py-5 pb-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Play
                  size={20}
                  className="text-red-600 dark:text-red-400 ml-0.5"
                  fill="currentColor"
                />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
                Watch
              </h1>
            </div>
            <Button
              leftIcon={<Plus size={16} />}
              onClick={() => setUploadOpen(true)}
            >
              Subir video
            </Button>
          </div>

          {/* Search — only show for home section */}
          {activeSection === "home" && (
            <>
              <div className="mb-4">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <div className="mb-6">
                <CategoryChips
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                />
              </div>
            </>
          )}

          {/* Content area */}
          {renderContent()}
        </div>
      </div>

      {/* Upload modal */}
      <UploadVideoModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
