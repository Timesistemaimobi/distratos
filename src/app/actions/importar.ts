"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Solicitacao } from "@/types";

type ImportPayload = Omit<Solicitacao, "id" | "criado_em" | "atualizado_em">;

type DuplicateCheckItem = {
  rowIndex: number;
  empreendimento: string;
  cliente: string;
  documento: string;
  mes_referencia: Date;
};

export async function verificarDuplicatas(
  items: DuplicateCheckItem[]
): Promise<{ duplicateRowIndexes: number[]; error?: string }> {
  if (items.length === 0) return { duplicateRowIndexes: [] };

  try {
    const supabase = await createClient();

    const months = [...new Set(items.map((i) => {
      const d = new Date(i.mes_referencia);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    }))];

    const { data, error } = await supabase
      .from("solicitacoes")
      .select("empreendimento, cliente, documento, mes_referencia")
      .in("mes_referencia", months);

    if (error) return { duplicateRowIndexes: [], error: error.message };

    const existing = new Set(
      (data ?? []).map((r) => {
        const d = new Date(r.mes_referencia);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return `${r.empreendimento}|${r.cliente}|${r.documento}|${m}`;
      })
    );

    const duplicateRowIndexes = items
      .filter((item) => {
        const d = new Date(item.mes_referencia);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return existing.has(`${item.empreendimento}|${item.cliente}|${item.documento}|${m}`);
      })
      .map((i) => i.rowIndex);

    return { duplicateRowIndexes };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro inesperado.";
    return { duplicateRowIndexes: [], error: message };
  }
}

export async function importarSolicitacoes(rows: ImportPayload[]): Promise<{
  success: boolean;
  inserted: number;
  error?: string;
}> {
  if (rows.length === 0) {
    return { success: false, inserted: 0, error: "Nenhuma linha válida para importar." };
  }

  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { success: false, inserted: 0, error: "Usuário não autenticado." };
    }

    const toInsert = rows.map((row) => ({
      ...row,
      user_id: userData.user!.id,
    }));

    const { error } = await supabase.from("solicitacoes").insert(toInsert);

    if (error) {
      return { success: false, inserted: 0, error: error.message };
    }

    await supabase.from("audit_logs").insert([
      {
        user_id: userData.user.id,
        action: "CREATE",
        entity: "solicitacoes",
        entity_id: "bulk-import",
        details: { message: `Importação em lote: ${rows.length} registros inseridos.` },
      },
    ]);

    revalidatePath("/solicitacoes");
    revalidatePath("/dashboard");

    return { success: true, inserted: rows.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro inesperado.";
    return { success: false, inserted: 0, error: message };
  }
}
