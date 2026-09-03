import { Skeleton, SkeletonCards, SkeletonTable } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <SkeletonCards count={4} />
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
