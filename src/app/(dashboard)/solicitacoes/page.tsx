import { createClient } from "@/lib/supabase/server";
import { DataTable } from "./data-table";

export default async function SolicitacoesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  
  const page = parseInt((searchParams.page as string) || "1");
  const limit = 10;
  
  const mes = (searchParams.mes as string) || "";
  const empreendimento = (searchParams.empreendimento as string) || "";
  const cliente = (searchParams.cliente as string) || "";
  const situacao = (searchParams.situacao as string) || "TODOS";

  let query = supabase
    .from("solicitacoes")
    .select("*", { count: "exact" })
    .order("criado_em", { ascending: false });

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
  if (situacao && situacao !== "TODOS") {
    query = query.eq("situacao", situacao);
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  
  const totalPages = count ? Math.ceil(count / limit) : 1;

  return (
    <DataTable 
      initialData={data || []} 
      totalPages={totalPages}
      currentPage={page}
    />
  );
}
