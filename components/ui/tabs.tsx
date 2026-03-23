"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TabsContext {
  active: string;
  setActive: (tab: string) => void;
}

const Ctx = createContext<TabsContext | undefined>(undefined);

interface TabsProps {
  defaultTab: string;
  children: ReactNode;
  className?: string;
  onChange?: (tab: string) => void;
}

export function Tabs({ defaultTab, children, className, onChange }: TabsProps) {
  const [active, setActive] = useState(defaultTab);
  const handleChange = (tab: string) => { setActive(tab); onChange?.(tab); };
  return (
    <Ctx.Provider value={{ active, setActive: handleChange }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}

interface TabListProps {
  children: ReactNode;
  className?: string;
  variant?: "line" | "pills" | "boxed";
}

export function TabList({ children, className, variant = "line" }: TabListProps) {
  return (
    <div className={cn(
      "flex",
      variant === "line" && "border-b border-slate-200 dark:border-slate-700",
      variant === "pills" && "gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl",
      variant === "boxed" && "gap-0 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden",
      className,
    )}>
      {children}
    </div>
  );
}

interface TabProps {
  value: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  badge?: number;
}

export function Tab({ value, children, className, icon, badge }: TabProps) {
  const { active, setActive } = useContext(Ctx)!;
  const isActive = active === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActive(value)}
      className={cn(
        "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all",
        "focus-visible:outline-none",
        isActive
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200",
        className,
      )}
    >
      {icon}
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
      )}
    </button>
  );
}

interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ value, children, className }: TabPanelProps) {
  const { active } = useContext(Ctx)!;
  if (active !== value) return null;
  return (
    <div role="tabpanel" className={cn("animate-fade-in", className)}>
      {children}
    </div>
  );
}
