import { cn } from '@/lib/utils';

const variantStyles: Record<string, string> = {
  admin: 'bg-purple-500/20 text-purple-300',
  banned: 'bg-red-500/20 text-red-300',
  verified: 'bg-blue-500/20 text-blue-300',
  active: 'bg-green-500/20 text-green-300',
  pending: 'bg-yellow-500/20 text-yellow-300',
  closed: 'bg-gray-500/20 text-gray-300',
  ended: 'bg-gray-500/20 text-gray-300',
  cancelled: 'bg-gray-500/20 text-gray-300',
  deleted: 'bg-gray-500/20 text-gray-300',
  live: 'bg-red-500/20 text-red-300 animate-pulse',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}

export default function Badge({ children, variant, className }: BadgeProps) {
  const key = (variant ?? (typeof children === 'string' ? children : '')).toLowerCase();
  const style = variantStyles[key] ?? 'bg-gray-500/20 text-gray-300';

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', style, className)}>
      {children}
    </span>
  );
}
