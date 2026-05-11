"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SolicitacaoSchema, type Solicitacao } from "@/types";
import { normalizarTexto } from "@/lib/utils/distratos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FormProps {
  initialData?: Solicitacao;
}

export function SolicitacaoForm({ initialData }: FormProps) {
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<Solicitacao>({
    resolver: zodResolver(SolicitacaoSchema),
    defaultValues: initialData || {
      situacao: "PENDENTE",
      mes_referencia: new Date(),
    },
  });

  const onSubmit = async (data: Solicitacao) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      // Normaliza os textos antes de salvar
      const payload = {
        mes_referencia: data.mes_referencia.toISOString().split('T')[0],
        empreendimento: normalizarTexto(data.empreendimento),
        bloco_quadra: data.bloco_quadra ? normalizarTexto(data.bloco_quadra) : null,
        unidade_lote: data.unidade_lote ? normalizarTexto(data.unidade_lote) : null,
        cliente: normalizarTexto(data.cliente),
        documento: normalizarTexto(data.documento),
        data_envio: data.data_envio ? (data.data_envio as any).toISOString().split('T')[0] : null,
        prazo_envio: data.prazo_envio ? (data.prazo_envio as any).toISOString().split('T')[0] : null,
        situacao: data.situacao,
        user_id: userData.user.id,
      };

      if (initialData?.id) {
        const { error } = await supabase.from("solicitacoes").update(payload).eq("id", initialData.id);
        if (error) throw error;
        toast.success("Solicitação atualizada com sucesso");
      } else {
        const { error } = await supabase.from("solicitacoes").insert([payload]);
        if (error) throw error;
        toast.success("Solicitação criada com sucesso");
      }

      router.push("/solicitacoes");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar a solicitação");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl w-full mx-auto bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl p-8 md:p-12 rounded-[32px] border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Mês de Referência *</Label>
          <Input
            type="date"
            {...register("mes_referencia")}
            defaultValue={initialData?.mes_referencia ? new Date(initialData.mes_referencia).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
            required
            className="h-12 rounded-xl"
          />
          {errors.mes_referencia && <span className="text-sm text-red-500">{errors.mes_referencia.message}</span>}
        </div>

        <div className="space-y-2">
          <Label>Situação *</Label>
          <Select
            defaultValue={initialData?.situacao || "PENDENTE"}
            onValueChange={(val: any) => setValue("situacao", val)}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="Selecione a situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="FINALIZADO">Finalizado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" {...register("situacao")} />
        </div>

        <div className="space-y-2">
          <Label>Empreendimento *</Label>
          <Input {...register("empreendimento")} placeholder="Ex: RESIDENCIAL FLORES" className="h-12 rounded-xl" />
          {errors.empreendimento && <span className="text-sm text-red-500">{errors.empreendimento.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Bloco/Quadra</Label>
            <Input {...register("bloco_quadra")} placeholder="Ex: BL 01" className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Unidade/Lote</Label>
            <Input {...register("unidade_lote")} placeholder="Ex: 104" className="h-12 rounded-xl" />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Cliente *</Label>
          <Input {...register("cliente")} placeholder="Nome do cliente" className="h-12 rounded-xl" />
          {errors.cliente && <span className="text-sm text-red-500">{errors.cliente.message}</span>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Documento (Tipo de Distrato) *</Label>
          <Select
            defaultValue={initialData?.documento || undefined}
            onValueChange={(val: any) => setValue("documento", val)}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="Selecione o tipo de distrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DISTRATO">DISTRATO</SelectItem>
              <SelectItem value="DISTRATO UNILATERAL">DISTRATO UNILATERAL</SelectItem>
              <SelectItem value="DISTRATO UNILATERAL ENVIADO">DISTRATO UNILATERAL ENVIADO</SelectItem>
              <SelectItem value="DISTRATO JUDICIAL">DISTRATO JUDICIAL</SelectItem>
              <SelectItem value="DISTRATO BILATERAL">DISTRATO BILATERAL</SelectItem>
              <SelectItem value="DISTRATO C/ TRANSFERENCIA DE SALDO">DISTRATO C/ TRANSFERENCIA DE SALDO</SelectItem>
              <SelectItem value="CANCELAMENTO SUMARIO">CANCELAMENTO SUMARIO</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" {...register("documento")} />
          {errors.documento && <span className="text-sm text-red-500">{errors.documento.message}</span>}
        </div>

        <div className="space-y-2">
          <Label>Data de Envio</Label>
          <Input
            type="date"
            {...register("data_envio")}
            defaultValue={initialData?.data_envio ? new Date(initialData.data_envio).toISOString().split('T')[0] : ''}
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label>Prazo de Envio</Label>
          <Input
            type="date"
            {...register("prazo_envio")}
            defaultValue={initialData?.prazo_envio ? new Date(initialData.prazo_envio).toISOString().split('T')[0] : ''}
            className="h-12 rounded-xl"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-8 mt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
        <Button type="button" variant="outline" onClick={() => router.back()} className="h-12 px-8 rounded-xl text-base active:scale-95 transition-all duration-200">Cancelar</Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-xl text-base shadow-sm active:scale-95 transition-all duration-200" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Solicitação"}
        </Button>
      </div>
    </form>
  );
}
