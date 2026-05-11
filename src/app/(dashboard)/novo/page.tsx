import { SolicitacaoForm } from "@/components/forms/SolicitacaoForm";
import { createClient } from "@/lib/supabase/server";
import { FilePlus } from "lucide-react";

export default async function NovoLancamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  let initialData = undefined;

  if (id) {
    const supabase = await createClient();
    const { data } = await supabase.from("solicitacoes").select("*").eq("id", id).single();
    if (data) initialData = data;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-12 flex flex-col items-center max-w-4xl mx-auto w-full space-y-12">
      <div className="w-full text-center space-y-4">
        <div className="mx-auto bg-blue-100 text-blue-600 w-20 h-20 rounded-[24px] flex items-center justify-center mb-6 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800/30">
          <FilePlus size={40} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {id ? "Editar Lançamento" : "Novo Lançamento"}
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
          {id ? "Atualize os dados da solicitação de distrato abaixo." : "Preencha o formulário para registrar uma nova solicitação no sistema. Certifique-se de validar todas as informações."}
        </p>
      </div>
      <div className="w-full">
        <SolicitacaoForm initialData={initialData} />
      </div>
    </div>
  );
}
