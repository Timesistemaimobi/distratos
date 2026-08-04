"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseImportFile, type ImportRow } from "@/lib/import/excel";
import { importarSolicitacoes, verificarDuplicatas } from "@/app/actions/importar";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Calendar,
  Database,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ParseState = "idle" | "parsing" | "checking" | "preview" | "done";

export default function ImportarPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mes, setMes] = useState(format(new Date(), "yyyy-MM"));
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [state, setState] = useState<ParseState>("idle");
  const [isPending, startTransition] = useTransition();
  const [showGuide, setShowGuide] = useState(false);
  const [duplicateIndexes, setDuplicateIndexes] = useState<Set<number>>(new Set());
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);
  const duplicateRows = validRows.filter((r) => duplicateIndexes.has(r.rowIndex));
  const newRows = validRows.filter((r) => !duplicateIndexes.has(r.rowIndex));
  const rowsToImport = skipDuplicates ? newRows : validRows;

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setState("parsing");
    setRows([]);

    try {
      const buffer = await file.arrayBuffer();
      const [year, month] = mes.split("-").map(Number);
      const mesReferencia = new Date(Date.UTC(year, month - 1, 1));
      const parsed = await parseImportFile(buffer, mesReferencia);

      if (parsed.length === 0) {
        toast.error(
          "Nenhuma linha de dados encontrada. Verifique se a planilha possui o cabeçalho correto."
        );
        setState("idle");
        return;
      }

      setRows(parsed);

      // Check duplicates against existing DB records
      const validParsed = parsed.filter((r) => r.errors.length === 0 && r.data);
      if (validParsed.length > 0) {
        setState("checking");
        const { duplicateRowIndexes } = await verificarDuplicatas(
          validParsed.map((r) => ({
            rowIndex: r.rowIndex,
            empreendimento: r.data!.empreendimento,
            cliente: r.data!.cliente,
            documento: r.data!.documento,
            mes_referencia: r.data!.mes_referencia,
          }))
        );
        setDuplicateIndexes(new Set(duplicateRowIndexes));
        if (duplicateRowIndexes.length > 0) {
          toast.warning(
            `${duplicateRowIndexes.length} registro(s) já existem no sistema e foram marcados como duplicados.`
          );
        }
      }

      setState("preview");
    } catch {
      toast.error("Erro ao ler o arquivo. Verifique se é um arquivo .xlsx válido.");
      setState("idle");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    if (rowsToImport.length === 0) return;

    startTransition(async () => {
      const payload = rowsToImport.map((r) => r.data!);
      const result = await importarSolicitacoes(payload);

      if (result.success) {
        toast.success(`${result.inserted} registro(s) importado(s) com sucesso!`);
        setState("done");
      } else {
        toast.error(result.error ?? "Erro ao importar.");
      }
    });
  };

  const handleReset = () => {
    setState("idle");
    setRows([]);
    setFileName(null);
    setDuplicateIndexes(new Set());
    setSkipDuplicates(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-12 flex flex-col items-center w-full space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl p-8 rounded-[24px] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Importar Planilha
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            Faça o upload de uma planilha Excel para importar os lançamentos em lote.
          </p>
        </div>

        <div className="flex flex-col gap-2 min-w-[280px]">
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Calendar size={16} /> Mês padrão
          </Label>
          <MonthPicker
            value={mes}
            onChange={(val) => {
              setMes(val);
              if (state === "preview") handleReset();
            }}
            placeholder="Mês de referência padrão"
            className="bg-white dark:bg-zinc-900 border-zinc-300 shadow-sm"
          />
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Todos os registros da planilha serão importados para este mês
          </p>
        </div>
      </div>

      {/* Guide / Instructions */}
      <div className="w-full">
        <button
          type="button"
          onClick={() => setShowGuide((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-6 py-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100/80 dark:hover:bg-blue-950/50 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Info size={16} />
            Como deve estar a planilha? Ver orientações de formato
          </span>
          {showGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showGuide && (
          <div className="mt-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/60 backdrop-blur-3xl divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden">
            {/* Colunas obrigatórias */}
            <div className="p-6 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Colunas obrigatórias
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                O cabeçalho deve conter exatamente estas colunas (sem distinção de maiúsculas/minúsculas ou acentos):
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900">
                      <th className="text-left px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-400 rounded-tl-lg">Coluna</th>
                      <th className="text-left px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-400">Obrigatório?</th>
                      <th className="text-left px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-400 rounded-tr-lg">Formato / Exemplo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {[
                      { col: "EMPREENDIMENTO", req: "Sim", fmt: "Texto livre · Ex: Residencial Aurora" },
                      { col: "BL / QD", req: "Não (pode ficar vazio)", fmt: "Texto livre · Ex: Bloco A" },
                      { col: "UND / LOTE", req: "Não (pode ficar vazio)", fmt: "Texto livre · Ex: 204" },
                      { col: "CLIENTE", req: "Sim", fmt: "Texto livre · Ex: João da Silva" },
                      { col: "DOCUMENTO", req: "Sim", fmt: "Texto livre · Ex: Distrato Unilateral" },
                      { col: "DATA DE ENVIO", req: "Não", fmt: "DD/MM/AAAA · Ex: 15/06/2025" },
                      { col: "PRAZO DE ENVIO", req: "Não", fmt: "DD/MM/AAAA · Ex: 30/06/2025" },
                      { col: "SITUAÇÃO", req: "Sim", fmt: "Ver valores aceitos abaixo" },
                    ].map(({ col, req, fmt }) => (
                      <tr key={col} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30">
                        <td className="px-3 py-2 font-mono text-blue-700 dark:text-blue-400 whitespace-nowrap">{col}</td>
                        <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{req}</td>
                        <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400">{fmt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Valores de situação */}
            <div className="p-6 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Valores aceitos para SITUAÇÃO
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { val: "PENDENTE", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
                  { val: "AGUARDANDO FINANCEIRO", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
                  { val: "ENVIADO", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
                  { val: "ASSINADO", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
                  { val: "AGUARDANDO SIENGE", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
                  { val: "FINALIZADO", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
                  { val: "CANCELADO", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
                ].map(({ val, cls }) => (
                  <span key={val} className={cn("px-3 py-1 rounded-full text-xs font-medium font-mono", cls)}>
                    {val}
                  </span>
                ))}
              </div>
            </div>

            {/* Aba da planilha */}
            <div className="p-6 space-y-2">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Aba e formato do arquivo
              </h3>
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1 list-disc list-inside">
                <li>Apenas arquivos <strong>.xlsx</strong> são aceitos</li>
                <li>O sistema lê preferencialmente a aba chamada <strong>Lançamentos</strong>; caso não exista, usa a primeira aba</li>
                <li>O cabeçalho pode estar em qualquer linha — o sistema localiza automaticamente</li>
                <li>Linhas completamente vazias são ignoradas</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Upload zone */}
      {(state === "idle" || state === "parsing" || state === "checking") && (
        <div className="w-full max-w-2xl mx-auto">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center gap-4 rounded-[24px] border-2 border-dashed p-16 cursor-pointer transition-colors",
              "border-zinc-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500",
              "bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl"
            )}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              aria-label="Selecionar arquivo Excel para importação"
              className="hidden"
              onChange={handleInputChange}
            />
            {state === "parsing" ? (
              <>
                <Loader2 size={48} className="text-blue-500 animate-spin" />
                <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                  Lendo {fileName}...
                </p>
              </>
            ) : state === "checking" ? (
              <>
                <Loader2 size={48} className="text-amber-500 animate-spin" />
                <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                  Verificando duplicatas...
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileSpreadsheet size={32} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                    Arraste o arquivo aqui ou clique para selecionar
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Somente arquivos <strong>.xlsx</strong> exportados pelo sistema
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-4 py-2 rounded-lg">
                  <Upload size={14} />
                  Selecionar arquivo
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {state === "preview" && (
        <div className="w-full space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-zinc-200/60 bg-white/60 backdrop-blur-3xl dark:bg-zinc-950/60 dark:border-zinc-800/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Total lido</CardDescription>
                <CardTitle className="text-3xl">{rows.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-emerald-200/60 bg-emerald-50/60 backdrop-blur-3xl dark:bg-emerald-950/20 dark:border-emerald-800/40 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-emerald-700 dark:text-emerald-400">Novos</CardDescription>
                <CardTitle className="text-3xl text-emerald-700 dark:text-emerald-400">
                  {newRows.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-amber-200/60 bg-amber-50/60 backdrop-blur-3xl dark:bg-amber-950/20 dark:border-amber-800/40 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-amber-700 dark:text-amber-400">Duplicados</CardDescription>
                <CardTitle className="text-3xl text-amber-700 dark:text-amber-400">
                  {duplicateRows.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-red-200/60 bg-red-50/60 backdrop-blur-3xl dark:bg-red-950/20 dark:border-red-800/40 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-red-700 dark:text-red-400">Com erro</CardDescription>
                <CardTitle className="text-3xl text-red-700 dark:text-red-400">
                  {invalidRows.length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Duplicate warning */}
          {duplicateRows.length > 0 && (
            <Card className="rounded-2xl border-amber-200/60 bg-white/60 dark:bg-zinc-950/60 dark:border-amber-800/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-base">
                  <AlertTriangle size={18} /> {duplicateRows.length} registro(s) já existem no sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 max-h-32 overflow-y-auto">
                  {duplicateRows.map((r) => (
                    <li key={r.rowIndex} className="flex items-start gap-1.5">
                      <span className="shrink-0 font-mono">Linha {r.rowIndex}:</span>
                      <span>{r.data!.empreendimento} — {r.data!.cliente} — {r.data!.documento}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setSkipDuplicates(true)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
                      skipDuplicates
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-amber-400"
                    )}
                  >
                    Pular duplicados ({newRows.length} serão importados)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkipDuplicates(false)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
                      !skipDuplicates
                        ? "bg-zinc-700 text-white border-zinc-700"
                        : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-zinc-500"
                    )}
                  >
                    Importar todos mesmo assim ({validRows.length})
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errors list */}
          {invalidRows.length > 0 && (
            <Card className="rounded-2xl border-red-200/60 bg-white/60 dark:bg-zinc-950/60 dark:border-zinc-800/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-base">
                  <AlertTriangle size={18} /> Linhas com erro (não serão importadas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {invalidRows.map((r) =>
                    r.errors.map((err, i) => (
                      <li
                        key={`${r.rowIndex}-${i}`}
                        className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
                      >
                        <XCircle size={15} className="mt-0.5 shrink-0" />
                        {err}
                      </li>
                    ))
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Valid rows preview table */}
          {validRows.length > 0 && (
            <Card className="rounded-2xl border-zinc-200/60 bg-white/60 dark:bg-zinc-950/60 dark:border-zinc-800/60 shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-base">
                  <CheckCircle2 size={18} /> Preview dos registros válidos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        {[
                          "#",
                          "",
                          "Empreendimento",
                          "Cliente",
                          "Documento",
                          "Bloco/Quadra",
                          "Unidade/Lote",
                          "Data Envio",
                          "Prazo Envio",
                          "Situação",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {validRows.map((r) => {
                        const d = r.data!;
                        const isDup = duplicateIndexes.has(r.rowIndex);
                        return (
                          <tr
                            key={r.rowIndex}
                            className={cn(
                              "border-b border-zinc-100 dark:border-zinc-800/60 transition-colors",
                              isDup
                                ? "bg-amber-50/60 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                : "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30"
                            )}
                          >
                            <td className="px-4 py-2.5 text-zinc-400">{r.rowIndex}</td>
                            <td className="px-2 py-2.5">
                              {isDup && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 whitespace-nowrap">
                                  duplicado
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-medium text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                              {d.empreendimento}
                            </td>
                            <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                              {d.cliente}
                            </td>
                            <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                              {d.documento}
                            </td>
                            <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-500">
                              {d.bloco_quadra ?? "—"}
                            </td>
                            <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-500">
                              {d.unidade_lote ?? "—"}
                            </td>
                            <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-500 whitespace-nowrap">
                              {d.data_envio
                                ? format(new Date(d.data_envio), "dd/MM/yyyy", { locale: ptBR })
                                : "—"}
                            </td>
                            <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-500 whitespace-nowrap">
                              {d.prazo_envio
                                ? format(new Date(d.prazo_envio), "dd/MM/yyyy", { locale: ptBR })
                                : "—"}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium",
                                  d.situacao === "FINALIZADO" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                                  d.situacao === "PENDENTE" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                                  d.situacao === "CANCELADO" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                  d.situacao === "AGUARDANDO_FINANCEIRO" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                  d.situacao === "ENVIADO" && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
                                  d.situacao === "ASSINADO" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                                  d.situacao === "AGUARDANDO_SIENGE" && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                                )}
                              >
                                {d.situacao ? d.situacao.replace(/_/g, " ") : "—"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isPending}
              className="rounded-xl h-12"
            >
              Cancelar e selecionar outro arquivo
            </Button>
            <Button
              onClick={handleImport}
              disabled={isPending || rowsToImport.length === 0}
              className="rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 min-w-[220px]"
            >
              {isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Importando...
                </>
              ) : (
                <>
                  <Database size={18} /> Importar {rowsToImport.length} registro(s)
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Done */}
      {state === "done" && (
        <div className="w-full max-w-md mx-auto">
          <Card className="rounded-[24px] border-emerald-200/60 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800/40 shadow-sm text-center">
            <CardContent className="pt-12 pb-10 flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  Importação concluída!
                </p>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                  {validRows.length} registro(s) foram salvos no sistema.
                </p>
              </div>
              <Button onClick={handleReset} variant="outline" className="rounded-xl">
                Importar outro arquivo
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
