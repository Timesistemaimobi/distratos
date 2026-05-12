import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSolicitacoes() {
  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-8 lg:p-10 space-y-8 w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-12 w-44 rounded-xl" />
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl rounded-[24px] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Table Area */}
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl rounded-[24px] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <tr>
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} className="h-14 px-6 text-left">
                    <Skeleton className="h-5 w-24 mx-auto" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-200/60 dark:border-zinc-800/60">
                  <td className="px-6 py-4">
                    <Skeleton className="h-5 w-20 mx-auto" />
                  </td>
                  <td className="px-6 py-4 space-y-2">
                    <Skeleton className="h-5 w-40 mx-auto" />
                    <Skeleton className="h-4 w-28 mx-auto" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-5 w-32 mx-auto" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-5 w-28 mx-auto" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-6 w-24 mx-auto rounded-full" />
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
