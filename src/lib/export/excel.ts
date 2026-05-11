import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Solicitacao } from "@/types";
import { agruparDetalhado, gerarResumo } from "../utils/distratos";
import { format } from "date-fns";

export async function exportarRelatorioMensal(solicitacoes: Solicitacao[], mesReferencia: Date) {
  const detalhado = agruparDetalhado(solicitacoes);
  const resumo = gerarResumo(detalhado);

  const workbook = new ExcelJS.Workbook();
  const wsDetalhado = workbook.addWorksheet("DETALHADO");
  const wsResumo = workbook.addWorksheet("RESUMO");

  if (detalhado.length > 0) {
    const columns = Object.keys(detalhado[0]).map(key => ({
      name: key,
      filterButton: true
    }));
    const rows = detalhado.map(row => Object.values(row));

    wsDetalhado.addTable({
      name: 'TabelaDetalhado',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleLight1',
        showRowStripes: true,
      },
      columns: columns,
      rows: rows,
    });
    wsDetalhado.columns.forEach(column => { column.width = 20; });
  }

  if (resumo.length > 0) {
    const columns = Object.keys(resumo[0]).map(key => ({
      name: key,
      filterButton: true
    }));
    const rows = resumo.map(row => Object.values(row));

    wsResumo.addTable({
      name: 'TabelaResumo',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleLight1',
        showRowStripes: true,
      },
      columns: columns,
      rows: rows,
    });
    wsResumo.columns.forEach(column => { column.width = 20; });

    let empMaisDistratado = "";
    let maxDistratos = -1;
    let totalUnilateral = 0;
    let totalUnilateralEnviado = 0;
    let totalBilateral = 0;
    let totalSolicitadoCliente = 0;
    let totalDeCujos = 0;
    let totalJudicial = 0;
    let totalComTransferencia = 0;
    let totalCancelamentoSumario = 0;

    for (const row of detalhado) {
      if (row["TOTAL_SOLICITACOES"] > maxDistratos) {
        maxDistratos = row["TOTAL_SOLICITACOES"];
        empMaisDistratado = row["EMPREENDIMENTO"];
      }
      totalUnilateral += row["DISTRATO UNILATERAL"];
      totalUnilateralEnviado += row["DISTRATO UNILATERAL ENVIADO"];
      totalBilateral += row["DISTRATO BILATERAL"];
      totalSolicitadoCliente += row["DISTRATO"];
      totalDeCujos += row["DISTRATO DE CUJOS"];
      totalJudicial += row["DISTRATO JUDICIAL"];
      totalComTransferencia += row["DISTRATO C/ TRANSFERENCIA DE SALDO"];
      totalCancelamentoSumario += row["CANCELAMENTO SUMARIO"];
    }

    wsResumo.addRow([]);
    wsResumo.addRow(["EMPREENDIMENTO MAIS DISTRATADO:", empMaisDistratado]);
    wsResumo.addRow(["TOTAL DE DISTRATO UNILATERAL:", totalUnilateral]);
    wsResumo.addRow(["DISTRATO UNILATERAL ENVIADO:", totalUnilateralEnviado]);
    wsResumo.addRow(["TOTAL DE DISTRATO BILATERAL:", totalBilateral]);
    wsResumo.addRow(["TOTAL DE DISTRATO SOLICITADO - CLIENTE:", totalSolicitadoCliente]);
    wsResumo.addRow(["TOTAL DE DISTRATO DE CUJOS:", totalDeCujos]);
    wsResumo.addRow(["TOTAL DE DISTRATO JUDICIAL:", totalJudicial]);
    wsResumo.addRow(["TOTAL DE DISTRATO COM TRANSFERENCIA:", totalComTransferencia]);
    wsResumo.addRow(["TOTAL DE CANCELAMENTO SUMARIO:", totalCancelamentoSumario]);
  }

  const mesAno = format(mesReferencia, "MM-yyyy");
  const fileName = `relatorio-analitico-${mesAno}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), fileName);
}


export async function exportarPlanilhaGeral(solicitacoes: Solicitacao[]) {
  const dadosFormatados = solicitacoes.map(s => ({
    "EMPREENDIMENTO": s.empreendimento,
    "BLOCO/QUADRA": s.bloco_quadra || "",
    "UNIDADE/LOTE": s.unidade_lote || "",
    "NOME DO CLIENTE": s.cliente,
    "DOCUMENTO (TIPO DE DISTRATO)": s.documento,
    "DATA DE ENVIO": s.data_envio ? format(new Date(s.data_envio), "dd/MM/yyyy") : "",
    "PRAZO DE ENVIO": s.prazo_envio ? format(new Date(s.prazo_envio), "dd/MM/yyyy") : "",
    "SITUAÇÃO": s.situacao
  }));

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Lançamentos");

  if (dadosFormatados.length > 0) {
    const columns = Object.keys(dadosFormatados[0]).map(key => ({
      name: key,
      filterButton: true
    }));
    const rows = dadosFormatados.map(row => Object.values(row));

    ws.addTable({
      name: 'TabelaLancamentos',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleLight1',
        showRowStripes: true,
      },
      columns: columns,
      rows: rows,
    });

    ws.columns.forEach(column => { column.width = 25; });
  }

  const fileName = `relatorio-geral-${format(new Date(), "dd-MM-yyyy")}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), fileName);
}
