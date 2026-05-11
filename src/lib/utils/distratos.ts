import { Solicitacao, DetalhadoRow, ResumoRow } from "@/types";

export function normalizarTexto(texto: string | undefined | null): string {
  if (!texto) return "";
  return texto
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

export function agruparDetalhado(solicitacoes: Solicitacao[]): DetalhadoRow[] {
  const mapa = new Map<string, DetalhadoRow>();

  for (const sol of solicitacoes) {
    const emp = normalizarTexto(sol.empreendimento);
    if (!mapa.has(emp)) {
      mapa.set(emp, {
        "EMPREENDIMENTO": emp,
        "DISTRATO": 0,
        "DISTRATO DE CUJOS": 0,
        "DISTRATO UNILATERAL": 0,
        "DISTRATO UNILATERAL ENVIADO": 0,
        "DISTRATO JUDICIAL": 0,
        "DISTRATO BILATERAL": 0,
        "DISTRATO C/ TRANSFERENCIA DE SALDO": 0,
        "CANCELAMENTO SUMARIO": 0,
        "FINALIZADOS": 0,
        "CANCELADOS": 0,
        "TOTAL_SOLICITACOES": 0,
      });
    }

    const row = mapa.get(emp)!;
    const doc = normalizarTexto(sol.documento);
    const sit = normalizarTexto(sol.situacao);

    // Contagem baseada no texto do documento
    if (doc === "DISTRATO") row["DISTRATO"]++;
    if (doc.includes("DISTRATO DE CUJOS")) row["DISTRATO DE CUJOS"]++;
    if (doc.includes("DISTRATO UNILATERAL ENVIADO")) row["DISTRATO UNILATERAL ENVIADO"]++;
    else if (doc.includes("DISTRATO UNILATERAL")) row["DISTRATO UNILATERAL"]++;
    
    if (doc.includes("DISTRATO JUDICIAL")) row["DISTRATO JUDICIAL"]++;
    if (doc.includes("DISTRATO BILATERAL")) row["DISTRATO BILATERAL"]++;
    if (doc.includes("TRANSFERENCIA DE SALDO")) row["DISTRATO C/ TRANSFERENCIA DE SALDO"]++;
    if (doc.includes("CANCELAMENTO SUMARIO")) row["CANCELAMENTO SUMARIO"]++;

    row["TOTAL_SOLICITACOES"]++;

    // Contagem de finalizados e cancelados baseada na situação
    if (sit === "FINALIZADO") row["FINALIZADOS"]++;
    if (sit === "CANCELADO") row["CANCELADOS"]++;
  }

  return Array.from(mapa.values()).sort((a, b) => a.EMPREENDIMENTO.localeCompare(b.EMPREENDIMENTO));
}

export function gerarResumo(detalhado: DetalhadoRow[]): ResumoRow[] {
  return detalhado.map((row) => {
    return {
      "EMPREENDIMENTO": row["EMPREENDIMENTO"],
      "SOLICITAÇÃO": row["TOTAL_SOLICITACOES"],
      "DISTRATO FINALIZADO": row["FINALIZADOS"],
      "CANCELADOS": row["CANCELADOS"],
    };
  });
}
