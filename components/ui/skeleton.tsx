import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
}

export function Skeleton({ className, rounded }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", rounded ? "rounded-full" : "rounded-lg", className)}
      aria-hidden="true"
    />
  );
}

export function PostSkeleton() {
  return (
    <div className="surface p-4 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11" rounded />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
      <Skeleton className="h-48 w-full" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="flex items-end gap-4 px-4 -mt-16 relative">
        <Skeleton className="w-28 h-28 border-4 border-white dark:border-gray-900" rounded />
        <div className="flex-1 pb-2 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-12 h-12" rounded />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-2.5 w-40" />
      </div>
      <Skeleton className="h-2.5 w-8" />
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="flex gap-3 p-3">
      <Skeleton className="w-12 h-12 shrink-0" rounded />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2.5 w-24" />
      </div>
    </div>
  );
}
