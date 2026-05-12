import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingDashboard() {
  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-8 lg:p-10 space-y-8 w-full mx-auto">
      {/* Header */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl p-8 rounded-[24px] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="space-y-2 min-w-[280px]">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-3xl dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60 p-6 space-y-4"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-20" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-3xl dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60 p-8 space-y-6">
          <Skeleton className="h-6 w-60" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
        <div className="rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-3xl dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60 p-8 space-y-6">
          <Skeleton className="h-6 w-52" />
          <div className="flex items-center justify-center h-[300px]">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
