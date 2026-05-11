"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { exportarRelatorioMensal, exportarPlanilhaGeral } from "@/lib/export/excel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { FileDown, TableProperties, LineChart, Calendar, Loader2 } from "lucide-react";

export default function ExportarPage() {
  const [mes, setMes] = useState(format(new Date(), "yyyy-MM"));
  const [loading, setLoading] = useState(false);
  const [loadingGeral, setLoadingGeral] = useState(false);
  const supabase = createClient();

  const handleExport = async () => {
    try {
      setLoading(true);
      const [year, month] = mes.split("-");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from("solicitacoes")
        .select("*")
        .gte("mes_referencia", startDate)
        .lte("mes_referencia", endDate);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error("Nenhuma solicitação encontrada para o mês selecionado.");
        setLoading(false);
        return;
      }

      await exportarRelatorioMensal(data, new Date(parseInt(year), parseInt(month) - 1, 1));
      toast.success("Relatório analítico exportado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao exportar");
    } finally {
      setLoading(false);
    }
  };

  const handleExportGeral = async () => {
    try {
      setLoadingGeral(true);
      
      const { data, error } = await supabase
        .from("solicitacoes")
        .select("*")
        .order("criado_em", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error("Nenhuma solicitação encontrada no sistema.");
        setLoadingGeral(false);
        return;
      }

      await exportarPlanilhaGeral(data);
      toast.success("Planilha geral exportada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao exportar planilha geral");
    } finally {
      setLoadingGeral(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-12 flex flex-col items-center w-full space-y-12 max-w-[1400px] mx-auto">
      {/* Header and Global Filter Section */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl p-8 rounded-[24px] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Exportar Dados</h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">Exporte os relatórios gerenciais e planilhas de lançamentos.</p>
        </div>
        
        <div className="flex flex-col gap-2 min-w-[280px]">
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Calendar size={16} /> Mês de Referência (Filtro Global)
          </Label>
          <Input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="h-12 text-lg rounded-xl bg-white dark:bg-zinc-900 border-zinc-300 shadow-sm"
          />
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 w-full max-w-5xl mx-auto">
        <Card className="w-full rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-zinc-200/60 bg-white/60 backdrop-blur-3xl dark:bg-zinc-950/60 dark:border-zinc-800/60 flex flex-col hover:border-blue-500/30 transition-colors">
          <CardHeader className="text-center pt-10">
            <div className="mx-auto bg-blue-100 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 dark:bg-blue-900/30 dark:text-blue-400">
              <FileDown size={32} />
            </div>
            <CardTitle className="text-2xl font-semibold">Relatório Analítico</CardTitle>
            <CardDescription className="text-base mt-3 leading-relaxed">
              Planilha com contagem e agrupamento (DETALHADO e RESUMO) baseada no mês filtrado acima.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1" />
          <CardFooter className="px-8 pb-10 mt-auto">
            <Button onClick={handleExport} disabled={loading || loadingGeral} className="w-full h-14 text-lg font-medium rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-sm flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="animate-spin" size={20} /> Processando...</> : "Exportar Relatório"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="w-full rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-zinc-200/60 bg-white/60 backdrop-blur-3xl dark:bg-zinc-950/60 dark:border-zinc-800/60 flex flex-col hover:border-emerald-500/30 transition-colors">
          <CardHeader className="text-center pt-10">
            <div className="mx-auto bg-emerald-100 text-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 dark:bg-emerald-900/30 dark:text-emerald-400">
              <TableProperties size={32} />
            </div>
            <CardTitle className="text-2xl font-semibold">Planilha Geral</CardTitle>
            <CardDescription className="text-base mt-3 leading-relaxed">
              Exportação completa de todos os lançamentos do sistema em formato de tabela simples (Raw Data).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center text-center px-8">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-900/50 p-4 rounded-xl">
              Empreendimento, Bloco/Quadra, Lote, Cliente, Documento, Datas e Situação.
            </p>
          </CardContent>
          <CardFooter className="px-8 pb-10 mt-auto">
            <Button onClick={handleExportGeral} disabled={loading || loadingGeral} className="w-full h-14 text-lg font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-all duration-200 shadow-sm flex items-center justify-center gap-2">
              {loadingGeral ? <><Loader2 className="animate-spin" size={20} /> Processando...</> : "Exportar Planilha Geral"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
