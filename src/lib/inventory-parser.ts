import { Product } from "./types";
import * as XLSX from "xlsx";

/**
 * Interface para retorno do parsing de inventário
 */
export interface InventoryParseResult {
  products: Partial<Product>[];
  totalLines: number;
  errors: string[];
}

/**
 * Realiza o parse de um arquivo de texto de inventário (largura fixa).
 * Layout esperado:
 * - Coluna 0 a 18: Referência (19 chars)
 * - Coluna 19 a 25: Código ERP (7 chars)
 * - Coluna 26 a 85: Descrição (60 chars)
 * - Coluna 86+: Marca
 * 
 * @param content Conteúdo do arquivo em string
 * @returns Array de produtos parciais
 */
export const parseTxtInventory = (content: string): InventoryParseResult => {
  const lines = content.split(/\r?\n/);
  const products: Partial<Product>[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Ignora linhas vazias ou muito curtas
    if (!line || line.trim().length < 30) continue;

    // A linha deve ter uma estrutura de largura fixa.
    // Vamos verificar se a posição 19 a 25 contém números (código ERP geralmente numérico ou alfanumérico curto)
    const referenciaRaw = line.substring(0, 19).trim();
    const codigoRaw = line.substring(19, 26).trim();
    const descricaoRaw = line.substring(26, 85).trim();
    const marcaRaw = line.substring(85).trim();

    // Uma heurística robusta para ignorar cabeçalhos:
    // O código ERP normalmente contém números. Se for vazio ou não contiver dígitos, ignoramos.
    if (codigoRaw === '' || !/\d/.test(codigoRaw)) {
      continue;
    }

    products.push({
      codigoExterno: codigoRaw,
      descricao: descricaoRaw,
      referencia: referenciaRaw,
      marca: marcaRaw,
      // 'codigo' será preenchido no momento de salvar (mesmo valor ou gerado)
      codigo: codigoRaw 
    });
  }

  return {
    products,
    totalLines: lines.length,
    errors
  };
};

/**
 * Realiza o parse de um arquivo Excel (XLS, XLSX) usando SheetJS.
 * 
 * @param fileBuffer ArrayBuffer do arquivo Excel
 * @returns Array de produtos parciais
 */
export const parseXlsInventory = async (fileBuffer: ArrayBuffer): Promise<InventoryParseResult> => {
  const products: Partial<Product>[] = [];
  const errors: string[] = [];
  
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Converte a planilha para JSON (matriz de arrays)
    const data = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 3) continue;

      const ref = (row[0] || '').toString().trim();
      const cod = (row[1] || '').toString().trim();
      const desc = (row[2] || '').toString().trim();
      const marca = (row[3] || '').toString().trim();

      // Heurística para ignorar cabeçalho
      if (cod === "" || cod.toLowerCase().includes("codigo")) continue;

      products.push({
        codigoExterno: cod,
        descricao: desc,
        referencia: ref,
        marca: marca,
        codigo: cod
      });
    }

    return {
      products,
      totalLines: data.length,
      errors
    };
  } catch (error: any) {
    return {
      products: [],
      totalLines: 0,
      errors: [error.message || "Erro ao processar arquivo Excel"]
    };
  }
};
