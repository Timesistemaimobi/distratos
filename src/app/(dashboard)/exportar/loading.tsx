import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingExportar() {
  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-12 flex flex-col items-center w-full space-y-12 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl p-8 rounded-[24px] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="space-y-2 min-w-[280px]">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 w-full max-w-5xl mx-auto">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-3xl dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60 p-10 flex flex-col items-center space-y-6"
          >
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-56" />
            <div className="flex-1" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
