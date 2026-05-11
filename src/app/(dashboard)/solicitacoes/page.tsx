"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Solicitacao } from "@/types";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Trash2, Plus, Search, Calendar, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SolicitacoesPage() {
  const [data, setData] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [mes, setMes] = useState("");
  const [empreendimento, setEmpreendimento] = useState("");
  const [cliente, setCliente] = useState("");
  const [situacao, setSituacao] = useState("TODOS");

  const supabase = createClient();
  const router = useRouter();

  const fetchSolicitacoes = async () => {
    setLoading(true);
    let query = supabase.from("solicitacoes").select("*").order("criado_em", { ascending: false });

    if (mes) {
      const [year, month] = mes.split("-");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();
      query = query.gte("mes_referencia", startDate).lte("mes_referencia", endDate);
    }
    if (empreendimento) {
      query = query.ilike("empreendimento", `%${empreendimento}%`);
    }
    if (cliente) {
      query = query.ilike("cliente", `%${cliente}%`);
    }
    if (situacao !== "TODOS") {
      query = query.eq("situacao", situacao);
    }

    const { data: solicitacoes, error } = await query;

    if (error) {
      toast.error("Erro ao buscar dados");
    } else {
      setData(solicitacoes || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSolicitacoes();
  }, [mes, empreendimento, cliente, situacao]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta solicitação?")) return;

    const { error } = await supabase.from("solicitacoes").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Solicitação excluída");
      fetchSolicitacoes();
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-12 space-y-8 max-w-[1400px] mx-auto w-full">
      
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
          <Input 
            type="month" 
            value={mes} 
            onChange={(e) => setMes(e.target.value)} 
            className="h-12 rounded-xl bg-white/50 dark:bg-zinc-900/50 border-zinc-200 focus:ring-2 focus:ring-blue-500/20"
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
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl rounded-[24px] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
              <TableRow className="hover:bg-transparent border-zinc-200/60 dark:border-zinc-800/60">
                <TableHead className="h-14 font-semibold text-zinc-600 px-6">Mês Ref.</TableHead>
                <TableHead className="h-14 font-semibold text-zinc-600">Empreendimento</TableHead>
                <TableHead className="h-14 font-semibold text-zinc-600">Cliente</TableHead>
                <TableHead className="h-14 font-semibold text-zinc-600">Documento</TableHead>
                <TableHead className="h-14 font-semibold text-zinc-600">Situação</TableHead>
                <TableHead className="h-14 font-semibold text-zinc-600 text-right px-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-400">
                      <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
                      <p>Carregando solicitações...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-zinc-500">
                    Nenhum registro encontrado para os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/60 transition-colors">
                    <TableCell className="px-6 py-4 text-zinc-500 font-medium">
                      {format(new Date(item.mes_referencia), "MM/yyyy")}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{item.empreendimento}</div>
                      {(item.bloco_quadra || item.unidade_lote) && (
                        <div className="text-sm text-zinc-500">
                          {item.bloco_quadra && `Blc/Qd: ${item.bloco_quadra}`} 
                          {item.bloco_quadra && item.unidade_lote && " • "}
                          {item.unidade_lote && `Und/Lt: ${item.unidade_lote}`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 font-medium">{item.cliente}</TableCell>
                    <TableCell className="py-4">
                      <div className="max-w-[200px] truncate" title={item.documento}>
                        {item.documento}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                          item.situacao === "FINALIZADO" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          item.situacao === "CANCELADO" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                        {item.situacao}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => router.push(`/novo?id=${item.id}`)}
                          className="h-10 w-10 rounded-full hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30"
                        >
                          <Edit2 size={18} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(item.id)}
                          className="h-10 w-10 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
