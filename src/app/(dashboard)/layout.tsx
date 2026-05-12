import { Navbar } from "@/components/layout/Navbar";
import { CommandPalette } from "@/components/ui/command-palette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
