"use client";

import { useState, useEffect, useTransition, useOptimistic } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebounce } from "use-debounce";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Solicitacao } from "@/types";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonthPicker } from "@/components/ui/month-picker";
import { Edit2, Trash2, Plus, Search, Calendar, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { deleteSolicitacao } from "@/app/actions/solicitacoes";

interface DataTableProps {
  initialData: Solicitacao[];
  totalPages: number;
  currentPage: number;
}

export function DataTable({ initialData, totalPages, currentPage }: DataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL
  const [mes, setMes] = useState(searchParams.get("mes") || "");
  const [empreendimento, setEmpreendimento] = useState(searchParams.get("empreendimento") || "");
  const [cliente, setCliente] = useState(searchParams.get("cliente") || "");
  const [situacao, setSituacao] = useState(searchParams.get("situacao") || "TODOS");

  // Debounce search inputs to avoid rapid refetches
  const [debouncedEmpreendimento] = useDebounce(empreendimento, 500);
  const [debouncedCliente] = useDebounce(cliente, 500);

  const [isPending, startTransition] = useTransition();

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset to page 1 on new filter
    params.set("page", "1");

    if (mes) params.set("mes", mes);
    else params.delete("mes");

    if (debouncedEmpreendimento) params.set("empreendimento", debouncedEmpreendimento);
    else params.delete("empreendimento");

    if (debouncedCliente) params.set("cliente", debouncedCliente);
    else params.delete("cliente");

    if (situacao && situacao !== "TODOS") params.set("situacao", situacao);
    else params.delete("situacao");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [mes, debouncedEmpreendimento, debouncedCliente, situacao, pathname, router]); // omitted searchParams to avoid loop

  const [optimisticData, addOptimisticAction] = useOptimistic(
    initialData,
    (state: Solicitacao[], action: { type: "delete"; id: string }) => {
      if (action.type === "delete") {
        return state.filter((item) => item.id !== action.id);
      }
      return state;
    }
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta solicitação?")) return;
    
    startTransition(() => {
      addOptimisticAction({ type: "delete", id });
    });

    const result = await deleteSolicitacao(id);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Solicitação excluída com sucesso");
    }
  };

  const columns = [
    {
      id: "mes_referencia",
      header: () => <div className="text-center">Mês Ref.</div>,
      accessorFn: (row: Solicitacao) => format(new Date(row.mes_referencia), "MM/yyyy"),
      cell: (info: any) => <div className="text-center text-zinc-500 font-medium">{info.getValue()}</div>,
    },
    {
      id: "empreendimento",
      header: () => <div className="text-center">Empreendimento</div>,
      accessorFn: (row: Solicitacao) => row,
      cell: (info: any) => {
        const item = info.getValue() as Solicitacao;
        return (
          <div className="min-w-[150px] max-w-[300px] mx-auto text-center">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 break-all whitespace-normal leading-tight">
              {item.empreendimento}
            </div>
            {(item.bloco_quadra || item.unidade_lote) && (
              <div className="text-sm text-zinc-500 mt-1">
                {item.bloco_quadra && `Blc/Qd: ${item.bloco_quadra}`} 
                {item.bloco_quadra && item.unidade_lote && " • "}
                {item.unidade_lote && `Und/Lt: ${item.unidade_lote}`}
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: () => <div className="text-center">Cliente</div>,
      accessorKey: "cliente",
      cell: (info: any) => (
        <div className="min-w-[120px] max-w-[250px] mx-auto font-medium break-all whitespace-normal leading-tight text-center">
          {info.getValue()}
        </div>
      ),
    },
    {
      header: () => <div className="text-center">Documento</div>,
      accessorKey: "documento",
      cell: (info: any) => (
        <div className="max-w-[180px] mx-auto truncate text-center" title={info.getValue()}>
          {info.getValue()}
        </div>
      )
    },
    {
      header: () => <div className="text-center">Situação</div>,
      accessorKey: "situacao",
      cell: (info: any) => {
        const val = info.getValue();
        const colors = val === "FINALIZADO" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" :
                       val === "CANCELADO" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                       "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
        return (
          <div className="text-center">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${colors}`}>
              {val}
            </span>
          </div>
        );
      }
    },
    {
      id: "actions",
      header: () => <div className="text-center px-6">Ações</div>,
      cell: (info: any) => {
        const id = info.row.original.id;
        return (
          <div className="flex justify-center gap-2 px-6">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push(`/novo?id=${id}`)}
              className="h-10 w-10 rounded-full hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30"
            >
              <Edit2 size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleDelete(id!)}
              className="h-10 w-10 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              <Trash2 size={18} />
            </Button>
          </div>
        );
      }
    }
  ];

  const table = useReactTable({
    data: optimisticData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-8 lg:p-10 space-y-8 w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Solicitações</h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">Gerencie todas as solicitações de distrato.</p>
        </div>
        <Button 
          onClick={() => router.push("/novo")} 
          className="bg-blue-600 hover:bg-blue-700 h-12 px-6 rounded-xl text-base shadow-sm active:scale-95 transition-all duration-200"
        >
          <Plus className="mr-2" size={20} />
          Novo Lançamento
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl rounded-[24px] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Calendar size={16} /> Mês de Ref.
          </Label>
          <MonthPicker
            value={mes}
            onChange={(val) => setMes(val)}
            placeholder="Selecione um mês"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <MapPin size={16} /> Empreendimento
          </Label>
          <Input 
            placeholder="Buscar empreendimento..." 
            value={empreendimento} 
            onChange={(e) => setEmpreendimento(e.target.value)} 
            className="h-12 rounded-xl bg-white/50 dark:bg-zinc-900/50 border-zinc-200 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Search size={16} /> Cliente
          </Label>
          <Input 
            placeholder="Buscar por cliente..." 
            value={cliente} 
            onChange={(e) => setCliente(e.target.value)} 
            className="h-12 rounded-xl bg-white/50 dark:bg-zinc-900/50 border-zinc-200 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            Status da Solicitação
          </Label>
          <Select value={situacao} onValueChange={(val) => setSituacao(val || "")}>
            <SelectTrigger className="h-12 rounded-xl bg-white/50 dark:bg-zinc-900/50 border-zinc-200">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os Status</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="FINALIZADO">Finalizado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Area */}
      <div className={`bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl rounded-[24px] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-opacity duration-300 ${isPending ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-zinc-200/60 dark:border-zinc-800/60">
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="h-14 font-semibold text-zinc-600 px-6">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/60 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-zinc-500">
                    Nenhum registro encontrado para os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-sm text-zinc-500">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="h-9 w-9 p-0 rounded-lg"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="h-9 w-9 p-0 rounded-lg"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
