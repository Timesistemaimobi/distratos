"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteSolicitacao(id: string) {
  try {
    const supabase = await createClient();
    
    // RLS will ensure user can only delete their own if configured
    const { error } = await supabase.from("solicitacoes").delete().eq("id", id);
    
    if (error) {
      return { success: false, error: error.message };
    }

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from("audit_logs").insert([{
        user_id: userData.user.id,
        action: 'DELETE',
        entity: 'solicitacoes',
        entity_id: id,
        details: { message: `Solicitação ${id} deletada.` }
      }]);
    }
    
    revalidatePath("/solicitacoes");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro inesperado" };
  }
}

export async function upsertSolicitacao(payload: any, id?: string) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const dataToSave = {
      ...payload,
      user_id: userData.user.id,
    };

    let error;
    if (id) {
      const res = await supabase.from("solicitacoes").update(dataToSave).eq("id", id);
      error = res.error;
    } else {
      const res = await supabase.from("solicitacoes").insert([dataToSave]).select("id").single();
      error = res.error;
      if (res.data) {
        id = res.data.id;
      }
    }

    if (error) {
      return { success: false, error: error.message };
    }

    // Insert Audit Log
    if (id) {
      await supabase.from("audit_logs").insert([{
        user_id: userData.user.id,
        action: payload.id ? 'UPDATE' : 'CREATE',
        entity: 'solicitacoes',
        entity_id: id,
        details: { 
          message: `Solicitação ${id} ${payload.id ? 'atualizada' : 'criada'}.`,
          changes: dataToSave
        }
      }]);
    }

    revalidatePath("/solicitacoes");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro inesperado" };
  }
}
