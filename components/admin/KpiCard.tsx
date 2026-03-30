import Skeleton from './Skeleton';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number;
  loading?: boolean;
}

export default function KpiCard({ title, value, icon, trend, loading }: KpiCardProps) {
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-12" />
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        <span className="text-gray-400">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {trend !== undefined && (
        <div className={`text-sm font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}
