"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Search, LayoutDashboard, ListTodo, PlusCircle, Download, X } from "lucide-react";

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  type: "page" | "record";
}

const PAGES: SearchResult[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", type: "page" },
  { id: "solicitacoes", label: "Solicitações", href: "/solicitacoes", type: "page" },
  { id: "novo", label: "Novo Lançamento", href: "/novo", type: "page" },
  { id: "exportar", label: "Exportar Relatório", href: "/exportar", type: "page" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>(PAGES);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Toggle with Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setResults(PAGES);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search solicitações when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults(PAGES);
      setSelectedIndex(0);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const pageResults = PAGES.filter((p) =>
      p.label.toLowerCase().includes(lowerQuery)
    );

    const searchDb = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("solicitacoes")
        .select("id, empreendimento, cliente, bloco_quadra, unidade_lote")
        .or(
          `empreendimento.ilike.%${query}%,cliente.ilike.%${query}%,documento.ilike.%${query}%`
        )
        .limit(8);

      const dbResults: SearchResult[] = (data || []).map((item) => ({
        id: item.id!,
        label: item.empreendimento || "Sem empreendimento",
        sublabel: `${item.cliente || ""}${item.bloco_quadra ? ` • Blc: ${item.bloco_quadra}` : ""}${item.unidade_lote ? ` • Und: ${item.unidade_lote}` : ""}`,
        href: `/novo?id=${item.id}`,
        type: "record" as const,
      }));

      setResults([...pageResults, ...dbResults]);
      setSelectedIndex(0);
      setLoading(false);
    };

    const timer = setTimeout(searchDb, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    router.push(result.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden animate-in zoom-in-95 fade-in slide-in-from-top-2 duration-200">
        {/* Input */}
        <div className="flex items-center gap-3 px-5 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <Search size={18} className="text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar páginas, solicitações..."
            className="flex-1 h-14 bg-transparent text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-2">
          {loading && (
            <div className="px-5 py-3 text-sm text-zinc-400">Buscando...</div>
          )}

          {!loading && results.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-zinc-400">
              Nenhum resultado encontrado.
            </div>
          )}

          {!loading &&
            results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-blue-50 dark:bg-blue-950/40"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  result.type === "page"
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}>
                  {result.type === "page" ? (
                    <LayoutDashboard size={16} />
                  ) : (
                    <ListTodo size={16} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {result.label}
                  </div>
                  {result.sublabel && (
                    <div className="text-xs text-zinc-400 truncate">
                      {result.sublabel}
                    </div>
                  )}
                </div>
                {result.type === "page" && (
                  <span className="text-[11px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                    Página
                  </span>
                )}
              </button>
            ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">↓</kbd>
            Navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">↵</kbd>
            Abrir
          </span>
        </div>
      </div>
    </div>
  );
}
