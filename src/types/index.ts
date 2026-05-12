import { z } from "zod";

export const SituacaoEnum = z.enum(["PENDENTE", "FINALIZADO", "CANCELADO"]);
export type Situacao = z.infer<typeof SituacaoEnum>;

export const SolicitacaoSchema = z.object({
  id: z.string().uuid().optional(),
  mes_referencia: z.coerce.date({
    message: "Mês de referência é obrigatório.",
  }),
  empreendimento: z.string().min(1, "Empreendimento é obrigatório."),
  bloco_quadra: z.string().optional(),
  unidade_lote: z.string().optional(),
  cliente: z.string().min(1, "Cliente é obrigatório."),
  documento: z.string().min(1, "Documento é obrigatório."),
  data_envio: z.preprocess((arg) => (arg === "" || arg == null ? undefined : arg), z.coerce.date().optional()),
  prazo_envio: z.preprocess((arg) => (arg === "" || arg == null ? undefined : arg), z.coerce.date().optional()),
  situacao: SituacaoEnum,
});

export type Solicitacao = z.infer<typeof SolicitacaoSchema> & {
  id: string;
  criado_em?: string;
  atualizado_em?: string;
};

// Types for Exports
export type DetalhadoRow = {
  "EMPREENDIMENTO": string;
  "DISTRATO": number;
  "DISTRATO DE CUJOS": number;
  "DISTRATO UNILATERAL": number;
  "DISTRATO UNILATERAL ENVIADO": number;
  "DISTRATO JUDICIAL": number;
  "DISTRATO BILATERAL": number;
  "DISTRATO C/ TRANSFERENCIA DE SALDO": number;
  "CANCELAMENTO SUMARIO": number;
  "FINALIZADOS": number;
  "CANCELADOS": number;
  "TOTAL_SOLICITACOES": number;
};

export type ResumoRow = {
  "EMPREENDIMENTO": string;
  "SOLICITAÇÃO": number;
  "DISTRATO FINALIZADO": number;
  "CANCELADOS": number;
};

export type AuditLog = {
  id: string;
  user_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entity_id: string;
  details?: Record<string, any>;
  created_at: string;
};
