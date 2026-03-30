'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  FileText,
  UsersRound,
  BookOpen,
  Calendar,
  ShoppingBag,
  Briefcase,
  Film,
  Radio,
  Heart,
  Clock,
  Star,
  BarChart2,
  Activity,
  Lock,
  ScrollText,
  Bell,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
  { label: 'Users', icon: Users, route: '/users' },
  { label: 'Moderation', icon: ShieldAlert, route: '/moderation' },
  { label: 'Posts', icon: FileText, route: '/posts' },
  { label: 'Groups', icon: UsersRound, route: '/groups' },
  { label: 'Pages', icon: BookOpen, route: '/pages' },
  { label: 'Events', icon: Calendar, route: '/events' },
  { label: 'Marketplace', icon: ShoppingBag, route: '/marketplace' },
  { label: 'Jobs', icon: Briefcase, route: '/jobs' },
  { label: 'Reels', icon: Film, route: '/reels' },
  { label: 'Streams', icon: Radio, route: '/streams' },
  { label: 'Fundraisers', icon: Heart, route: '/fundraisers' },
  { label: 'Stories', icon: Clock, route: '/stories' },
  { label: 'Premium', icon: Star, route: '/premium' },
  { label: 'Analytics', icon: BarChart2, route: '/analytics' },
  { label: 'System Health', icon: Activity, route: '/system-health' },
  { label: 'GDPR', icon: Lock, route: '/gdpr' },
  { label: 'Audit Log', icon: ScrollText, route: '/audit-log' },
  { label: 'Notifications', icon: Bell, route: '/notifications' },
  { label: 'Settings', icon: Settings, route: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-gray-900 flex flex-col h-screen transition-all duration-200 shrink-0',
          // Desktop
          'hidden md:flex',
          collapsed ? 'md:w-16' : 'md:w-60',
          // Mobile: overlay drawer
          mobileOpen && '!flex fixed inset-y-0 left-0 z-50 w-60 shadow-2xl',
        )}
      >
        {/* Toggle button */}
        <div className="flex items-center h-12 px-3 border-b border-gray-800">
          <button
            onClick={() => {
              if (mobileOpen) setMobileOpen(false);
              else setCollapsed((c) => !c);
            }}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {mobileOpen || !collapsed ? <X size={18} /> : <Menu size={18} />}
          </button>
          {(!collapsed || mobileOpen) && (
            <span className="ml-3 text-white font-semibold text-sm truncate">
              Admin Panel
            </span>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map(({ label, icon: Icon, route }) => {
            const isActive = pathname === route || pathname.startsWith(route + '/');
            return (
              <Link
                key={route}
                href={route}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 mx-2 my-0.5 rounded text-sm transition-colors',
                  isActive
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800',
                  collapsed && !mobileOpen && 'justify-center px-0 mx-1'
                )}
                title={collapsed && !mobileOpen ? label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {(!collapsed || mobileOpen) && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
