'use server';

/**
 * @fileOverview Generates a filtered warranty report in PDF format based on user selections.
 *
 * - generateFilteredWarrantyReport - A function that generates the filtered warranty report.
 * - GenerateFilteredWarrantyReportInput - The input type for the generateFilteredwarrantyReport function.
 * - GenerateFilteredWarrantyReportOutput - The return type for the generateFilteredwarrantyReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';
import type { Warranty, CompanyData } from '@/lib/types';


// Extend jsPDF with autoTable, which is a plugin
declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: UserOptions) => jsPDF;
    }
}

const WarrantyDataSchema = z.object({
  codigo: z.string().optional(),
  descricao: z.string().optional(),
  fornecedor: z.string().optional(),
  quantidade: z.number().optional(),
  defeito: z.string().optional(),
  requisicoes: z.string().optional(),
  nfCompra: z.string().optional(),
  valorCompra: z.string().optional(),
  cliente: z.string().optional(),
  mecanico: z.string().optional(),
  notaFiscalSaida: z.string().optional(),
  notaFiscalRetorno: z.string().optional(),
  observacao: z.string().optional(),
  dataRegistro: z.string().optional(),
  status: z.enum(['Em análise', 'Aprovada', 'Recusada', 'Paga']).optional(),
  loteId: z.number().nullable().optional(),
});

const CompanyDataSchema = z.object({
  nomeEmpresa: z.string().optional(),
  cnpj: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
}).nullable();


const GenerateFilteredWarrantyReportInputSchema = z.object({
  selectedWarranties: z
    .array(WarrantyDataSchema)
    .describe('Array of selected warranty records.'),
  selectedFields: z
    .array(z.string())
    .describe('Array of field names to include in the report.'),
  companyData: CompanyDataSchema.describe('Company data for the report header.'),
});

export type GenerateFilteredWarrantyReportInput = z.infer<
  typeof GenerateFilteredWarrantyReportInputSchema
>;

const GenerateFilteredWarrantyReportOutputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe('The PDF report as a data URI (base64 encoded).'),
});

export type GenerateFilteredWarrantyReportOutput = z.infer<
  typeof GenerateFilteredWarrantyReportOutputSchema
>;

export async function generateFilteredWarrantyReport(
  input: GenerateFilteredWarrantyReportInput
): Promise<GenerateFilteredWarrantyReportOutput> {
  return generateFilteredWarrantyReportFlow(input);
}


const generateFilteredWarrantyReportFlow = ai.defineFlow(
  {
    name: 'generateFilteredWarrantyReportFlow',
    inputSchema: GenerateFilteredWarrantyReportInputSchema,
    outputSchema: GenerateFilteredWarrantyReportOutputSchema,
  },
  async ({ selectedWarranties, selectedFields, companyData }) => {
    const doc = new jsPDF();

    // Header
    if (companyData?.nomeEmpresa) {
        doc.setFontSize(16);
        doc.text(companyData.nomeEmpresa, 14, 20);
    }
    
    doc.setFontSize(9);
    let headerY = 25;
    if (companyData?.endereco) {
        let fullAddress = companyData.endereco;
        if(companyData.bairro) {
            fullAddress += `, ${companyData.bairro}`
        }
        doc.text(fullAddress, 14, headerY);
        headerY += 4;
    }
     if (companyData?.cidade) {
        doc.text(companyData.cidade, 14, headerY);
        headerY += 4;
    }
    if (companyData?.telefone) {
        doc.text(`Tel: ${companyData.telefone}`, 14, headerY);
        headerY += 4;
    }
    if (companyData?.email) {
        doc.text(`Email: ${companyData.email}`, 14, headerY);
    }
    
    // Report Title
    doc.setFontSize(18);
    doc.text('Relatório de Garantias para Fornecedor', doc.internal.pageSize.getWidth() / 2, 22, { align: 'center'});
    
    // Generation Date
    doc.setFontSize(10);
    const date = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${date}`, doc.internal.pageSize.getWidth() - 14, 28, { align: 'right'});

    const tableHeaders = selectedFields.map(field => field.replace(/([A-Z])/g, ' $1').toUpperCase());
    const tableBody = selectedWarranties.map(warranty => {
        // Use a type assertion to inform TypeScript about the structure
        const warrantyRecord = warranty as Record<string, string | number | boolean | null | undefined>;
        return selectedFields.map(field => {
            const key = field as keyof Omit<Warranty, 'id'>;
            return warrantyRecord[key]?.toString() || '-';
        });
    });

    doc.autoTable({
        startY: headerY + 10 > 35 ? headerY + 10 : 35,
        head: [tableHeaders],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
    });
    
    const pdfDataUri = doc.output('datauristring');

    return { pdfDataUri };
  }
);
