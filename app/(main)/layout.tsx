"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/navbar";
import { SidebarLeft } from "@/components/layout/sidebar-left";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ToastProvider } from "@/components/ui/toast";
import { PageSpinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next"
// Pages where the left sidebar should be collapsed to icon-only mode
const WIDE_PAGES = ["/messages"];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isWidePage = WIDE_PAGES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-gray-950">
        <PageSpinner />
      </div>
    );
  }

  if (!user) return null;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
        {/* Top navbar — fixed, z-40 */}
        <Navbar />

        <div className="flex pt-14">
          {/* Left sidebar — fixed, hidden on mobile */}
          <div className="hidden md:block">
            <SidebarLeft collapsed={isWidePage} />
          </div>

          {/* Main content */}
          <main
            className={cn(
              "flex-1 min-h-[calc(100vh-3.5rem)] transition-all duration-200",
              // Offset to avoid being hidden behind the fixed sidebar
              isWidePage ? "md:ml-16" : "md:ml-[260px]",
              // Bottom padding on mobile so content isn't hidden behind the bottom nav
              "pb-16 md:pb-0",
            )}
          >
            <div className="max-w-screen-2xl mx-auto">{children}</div>
          </main>
        </div>

        {/* Bottom nav — mobile only, z-40 */}
        <MobileNav />
      </div>
    </ToastProvider>
  );
}
