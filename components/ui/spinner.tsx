import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = { xs: "w-3 h-3", sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" };

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={cn(
        sizes[size],
        "rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-indigo-600 animate-spin",
        className,
      )}
      role="status"
      aria-label="Cargando..."
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Spinner size="lg" />
    </div>
  );
}
