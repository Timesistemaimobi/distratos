import ExcelJS from "exceljs";
import { parse, isValid } from "date-fns";
import { SituacaoEnum, SolicitacaoSchema } from "@/types";
import type { Solicitacao } from "@/types";

export type ImportRow = {
  rowIndex: number;
  data: Omit<Solicitacao, "id" | "criado_em" | "atualizado_em"> | null;
  errors: string[];
};

const SITUACAO_MAP: Record<string, string> = {
  PENDENTE: "PENDENTE",
  "AGUARDANDO FINANCEIRO": "AGUARDANDO_FINANCEIRO",
  AGUARDANDO_FINANCEIRO: "AGUARDANDO_FINANCEIRO",
  ENVIADO: "ENVIADO",
  ASSINADO: "ASSINADO",
  "AGUARDANDO SIENGE": "AGUARDANDO_SIENGE",
  AGUARDANDO_SIENGE: "AGUARDANDO_SIENGE",
  FINALIZADO: "FINALIZADO",
  CANCELADO: "CANCELADO",
};

function parseBRDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return isValid(value) ? value : undefined;

  const str = String(value).trim();
  for (const fmt of ["dd/MM/yyyy", "yyyy-MM-dd", "MM/dd/yyyy"]) {
    const d = parse(str, fmt, new Date());
    if (isValid(d)) return d;
  }
  return undefined;
}

function parseMonthYear(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return isValid(value) ? new Date(Date.UTC(value.getFullYear(), value.getMonth(), 1)) : undefined;

  const str = String(value).trim();
  for (const fmt of ["MM/yyyy", "yyyy-MM", "MM-yyyy"]) {
    const d = parse(str, fmt, new Date());
    if (isValid(d)) return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1));
  }
  return undefined;
}

function cellText(row: ExcelJS.Row, col: number): string {
  const cell = row.getCell(col);
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && "text" in (v as object))
    return String((v as ExcelJS.CellRichTextValue).text ?? "").trim();
  if (typeof v === "object" && "result" in (v as object))
    return String((v as ExcelJS.CellFormulaValue).result ?? "").trim();
  return String(v).trim();
}

function normalizeHeader(str: string): string {
  return str.trim().toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

type ColKey =
  | "EMPREENDIMENTO"
  | "BLOCO/QUADRA"
  | "UNIDADE/LOTE"
  | "NOME DO CLIENTE"
  | "DOCUMENTO (TIPO DE DISTRATO)"
  | "DATA DE ENVIO"
  | "PRAZO DE ENVIO"
  | "SITUAÇÃO";

const REQUIRED_COLS: ColKey[] = [
  "EMPREENDIMENTO",
  "BLOCO/QUADRA",
  "UNIDADE/LOTE",
  "NOME DO CLIENTE",
  "DOCUMENTO (TIPO DE DISTRATO)",
  "DATA DE ENVIO",
  "PRAZO DE ENVIO",
  "SITUAÇÃO",
];

// Maps every accepted header variant (after NFD normalization + uppercase) → internal ColKey
const HEADER_ALIASES: Record<string, ColKey> = {
  "EMPREENDIMENTO": "EMPREENDIMENTO",
  "EMPREENDIMENTOS": "EMPREENDIMENTO",
  "BLOCO/QUADRA": "BLOCO/QUADRA",
  "BLOCO / QUADRA": "BLOCO/QUADRA",
  "BL/QD": "BLOCO/QUADRA",
  "BL / QD": "BLOCO/QUADRA",
  "BLOCO": "BLOCO/QUADRA",
  "UNIDADE/LOTE": "UNIDADE/LOTE",
  "UNIDADE / LOTE": "UNIDADE/LOTE",
  "UND/LOTE": "UNIDADE/LOTE",
  "UND / LOTE": "UNIDADE/LOTE",
  "UNIDADE": "UNIDADE/LOTE",
  "NOME DO CLIENTE": "NOME DO CLIENTE",
  "CLIENTE": "NOME DO CLIENTE",
  "NOME": "NOME DO CLIENTE",
  "DOCUMENTO (TIPO DE DISTRATO)": "DOCUMENTO (TIPO DE DISTRATO)",
  "DOCUMENTO": "DOCUMENTO (TIPO DE DISTRATO)",
  "TIPO DE DISTRATO": "DOCUMENTO (TIPO DE DISTRATO)",
  "DATA DE ENVIO": "DATA DE ENVIO",
  "DATA DO ENVIO": "DATA DE ENVIO",
  "DATA ENVIO": "DATA DE ENVIO",
  "PRAZO DE ENVIO": "PRAZO DE ENVIO",
  "PRAZO DO ENVIO": "PRAZO DE ENVIO",
  "PRAZO ENVIO": "PRAZO DE ENVIO",
  "PRAZO": "PRAZO DE ENVIO",
  "SITUACAO": "SITUAÇÃO",
  "SITUAÇÃO": "SITUAÇÃO",
  "STATUS": "SITUAÇÃO",
};

const OPTIONAL_COL_MES = "MÊS DE REFERÊNCIA";

export async function parseImportFile(
  buffer: ArrayBuffer,
  mesReferenciaFallback: Date
): Promise<ImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.getWorksheet("Lançamentos") ?? workbook.worksheets[0];
  if (!sheet) return [];

  const results: ImportRow[] = [];
  let headerFound = false;
  let colMap: Record<string, number> = {};
  let mesColIdx: number | null = null;

  sheet.eachRow((row, rowNumber) => {
    if (!headerFound) {
      const mapped: Record<string, number> = {};
      row.eachCell((cell, colIdx) => {
        const header = normalizeHeader(String(cell.value ?? ""));
        const internalKey = HEADER_ALIASES[header];
        if (internalKey) mapped[internalKey] = colIdx;
        if (header === normalizeHeader(OPTIONAL_COL_MES)) {
          mesColIdx = colIdx;
        }
      });

      if (REQUIRED_COLS.every((c) => mapped[c] > 0)) {
        headerFound = true;
        colMap = mapped;
      }
      return;
    }

    const empreendimento = cellText(row, colMap["EMPREENDIMENTO"]);
    if (!empreendimento) return;

    const errors: string[] = [];

    const situacaoRaw = cellText(row, colMap["SITUAÇÃO"]).toUpperCase();
    const situacaoMapped = situacaoRaw === "" ? "PENDENTE" : (SITUACAO_MAP[situacaoRaw] ?? situacaoRaw);
    const situacaoParsed = SituacaoEnum.safeParse(situacaoMapped);
    if (situacaoRaw !== "" && !situacaoParsed.success) {
      errors.push(
        `Linha ${rowNumber}: situação inválida "${situacaoRaw}". Valores aceitos: PENDENTE, AGUARDANDO FINANCEIRO, ENVIADO, ASSINADO, AGUARDANDO SIENGE, FINALIZADO, CANCELADO.`
      );
    }

    const cliente = cellText(row, colMap["NOME DO CLIENTE"]);
    if (!cliente) errors.push(`Linha ${rowNumber}: nome do cliente é obrigatório.`);

    const documento = cellText(row, colMap["DOCUMENTO (TIPO DE DISTRATO)"]);
    if (!documento) errors.push(`Linha ${rowNumber}: documento é obrigatório.`);

    let mesReferencia = mesReferenciaFallback;
    if (mesColIdx !== null) {
      const mesCelula = row.getCell(mesColIdx).value;
      const mesParsed = parseMonthYear(mesCelula);
      if (mesParsed) {
        mesReferencia = mesParsed;
      } else if (mesCelula) {
        errors.push(
          `Linha ${rowNumber}: mês de referência inválido "${mesCelula}". Use o formato MM/AAAA (ex: 06/2025).`
        );
      }
    }

    const raw = {
      mes_referencia: mesReferencia,
      empreendimento,
      bloco_quadra: cellText(row, colMap["BLOCO/QUADRA"]) || undefined,
      unidade_lote: cellText(row, colMap["UNIDADE/LOTE"]) || undefined,
      cliente,
      documento,
      data_envio: parseBRDate(row.getCell(colMap["DATA DE ENVIO"]).value),
      prazo_envio: parseBRDate(row.getCell(colMap["PRAZO DE ENVIO"]).value),
      situacao: situacaoParsed.success ? situacaoParsed.data : "PENDENTE",
    };

    if (errors.length > 0) {
      results.push({ rowIndex: rowNumber, data: null, errors });
      return;
    }

    const parsed = SolicitacaoSchema.safeParse(raw);
    if (!parsed.success) {
      results.push({
        rowIndex: rowNumber,
        data: null,
        errors: parsed.error.errors.map((e) => `Linha ${rowNumber}: ${e.message}`),
      });
      return;
    }

    results.push({ rowIndex: rowNumber, data: parsed.data, errors: [] });
  });

  return results;
}
