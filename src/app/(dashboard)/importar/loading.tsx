import { Skeleton } from "@/components/ui/skeleton";

export default function ImportarLoading() {
  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-12 flex flex-col items-center w-full space-y-8 max-w-[1400px] mx-auto">
      <div className="w-full bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl p-8 rounded-[24px] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <Skeleton className="h-10 w-64 mb-3" />
        <Skeleton className="h-6 w-96" />
      </div>
      <div className="w-full max-w-2xl mx-auto">
        <Skeleton className="h-72 w-full rounded-[24px]" />
      </div>
    </div>
  );
}
