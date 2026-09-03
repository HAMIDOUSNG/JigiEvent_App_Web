import { cn } from "@/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-border px-5 py-3.5">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={cn("h-4", c === 0 ? "w-40" : "flex-1")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-surface p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-4 h-8 w-28" />
          <Skeleton className="mt-3 h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
