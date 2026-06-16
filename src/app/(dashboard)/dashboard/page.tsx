import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  
  const currentMonth = format(new Date(), "yyyy-MM");
  const mes = (searchParams.mes as string) || currentMonth;

  let query = supabase.from("solicitacoes").select("*");

  if (mes) {
    const [year, month] = mes.split("-");
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();
    query = query.gte("mes_referencia", startDate).lte("mes_referencia", endDate);
  }

  const { data: solicitacoes } = await query;
  const safeData = solicitacoes || [];

  // KPIs
  const total = safeData.length;
  const finalizados = safeData.filter(s => s.situacao === "FINALIZADO").length;
  const cancelados = safeData.filter(s => s.situacao === "CANCELADO").length;
  const aguardandoFinanceiro = safeData.filter(s => s.situacao === "AGUARDANDO_FINANCEIRO").length;
  const pendentes = safeData.filter(s => s.situacao === "PENDENTE").length;

  // Atrasados = Pendentes/Aguardando cujo prazo_envio expirou
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const atrasados = safeData.filter(s => {
    if ((s.situacao !== "PENDENTE" && s.situacao !== "AGUARDANDO_FINANCEIRO") || !s.prazo_envio) return false;
    const prazo = new Date(s.prazo_envio);
    return prazo < hoje;
  }).length;

  // Chart Data: Empreendimento
  const byEmpreendimento = safeData.reduce((acc: any, curr) => {
    const emp = curr.empreendimento || "N/I";
    acc[emp] = (acc[emp] || 0) + 1;
    return acc;
  }, {});

  const chartEmpreendimento = Object.keys(byEmpreendimento)
    .map(key => ({ name: key, value: byEmpreendimento[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5

  // Chart Data: Situação
  const chartSituacao = [
    { name: "Finalizados", value: finalizados, color: "#10b981" },
    { name: "Pendentes", value: pendentes, color: "#f59e0b" },
    { name: "Ag. Financeiro", value: aguardandoFinanceiro, color: "#3b82f6" },
    { name: "Cancelados", value: cancelados, color: "#ef4444" },
  ].filter(item => item.value > 0);

  return (
    <DashboardClient 
      initialMes={mes}
      total={total}
      finalizados={finalizados}
      cancelados={cancelados}
      pendentes={pendentes}
      atrasados={atrasados}
      chartEmpreendimento={chartEmpreendimento}
      chartSituacao={chartSituacao}
    />
  );
}
