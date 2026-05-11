import { agruparDetalhado, gerarResumo } from "../src/lib/utils/distratos";
import { Solicitacao } from "../src/types";

// Dados Mock
export const mockSolicitacoes: Solicitacao[] = [
  {
    id: "1",
    mes_referencia: new Date("2023-10-01"),
    empreendimento: "RESIDENCIAL FLORES",
    cliente: "João da Silva",
    documento: "DISTRATO",
    situacao: "FINALIZADO"
  },
  {
    id: "2",
    mes_referencia: new Date("2023-10-01"),
    empreendimento: "RESIDENCIAL FLORES",
    cliente: "Maria Souza",
    documento: "DISTRATO UNILATERAL",
    situacao: "CANCELADO"
  },
  {
    id: "3",
    mes_referencia: new Date("2023-10-01"),
    empreendimento: "EDIFICIO CENTRAL",
    cliente: "Pedro Santos",
    documento: "CANCELAMENTO SUMARIO",
    situacao: "PENDENTE"
  }
];

describe("Testes de Agrupamento e Resumo", () => {
  it("deve agrupar os dados detalhados corretamente por empreendimento e contabilizar colunas", () => {
    const resultado = agruparDetalhado(mockSolicitacoes);

    expect(resultado).toHaveLength(2);

    const flores = resultado.find(r => r.EMPREENDIMENTO === "RESIDENCIAL FLORES");
    expect(flores).toBeDefined();
    expect(flores?.["DISTRATO"]).toBe(1);
    expect(flores?.["DISTRATO UNILATERAL"]).toBe(1);
    expect(flores?.["FINALIZADOS"]).toBe(1);
    expect(flores?.["CANCELADOS"]).toBe(1);

    const central = resultado.find(r => r.EMPREENDIMENTO === "EDIFICIO CENTRAL");
    expect(central).toBeDefined();
    expect(central?.["CANCELAMENTO SUMARIO"]).toBe(1);
    expect(central?.["FINALIZADOS"]).toBe(0);
    expect(central?.["CANCELADOS"]).toBe(0);
  });

  it("deve gerar o resumo corretamente com os totais de finalizados e cancelados", () => {
    const detalhado = agruparDetalhado(mockSolicitacoes);
    const resumo = gerarResumo(detalhado);

    expect(resumo).toHaveLength(2);

    const floresResumo = resumo.find(r => r.EMPREENDIMENTO === "RESIDENCIAL FLORES");
    expect(floresResumo?.SOLICITAÇÃO).toBe(2); // 1 Finalizado + 1 Cancelado
    expect(floresResumo?.["DISTRATO FINALIZADO"]).toBe(1);
    expect(floresResumo?.["CANCELADOS"]).toBe(1);

    const centralResumo = resumo.find(r => r.EMPREENDIMENTO === "EDIFICIO CENTRAL");
    expect(centralResumo?.SOLICITAÇÃO).toBe(0);
  });
});
