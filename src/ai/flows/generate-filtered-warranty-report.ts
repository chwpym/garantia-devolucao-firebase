'use server';

/**
 * @fileOverview Generates a filtered warranty report in PDF format based on user selections.
 *
 * - generateFilteredWarrantyReport - A function that generates the filtered warranty report.
 * - GenerateFilteredWarrantyReportInput - The input type for the generateFilteredWarrantyReport function.
 * - GenerateFilteredWarrantyReportOutput - The return type for the generateFilteredWarrantyReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { getWarrantiesByIds } from '@/lib/db';
import type { Warranty } from '@/lib/types';


// Extend jsPDF with autoTable, which is a plugin
declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}

const GenerateFilteredWarrantyReportInputSchema = z.object({
  selectedWarrantyIds: z
    .array(z.string())
    .describe('Array of IDs of the selected warranty records.'),
  selectedFields: z
    .array(z.string())
    .describe('Array of field names to include in the report.'),
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
  async ({ selectedWarrantyIds, selectedFields }) => {
    const numericIds = selectedWarrantyIds.map(id => parseInt(id, 10));
    const warranties = await getWarrantiesByIds(numericIds);

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Garantias para Fornecedor', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    const date = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${date}`, 14, 28);

    const tableHeaders = selectedFields.map(field => field.replace(/([A-Z])/g, ' $1').toUpperCase());
    const tableBody = warranties.map(warranty => {
        return selectedFields.map(field => warranty[field as keyof Warranty]?.toString() || '-');
    });

    doc.autoTable({
        startY: 35,
        head: [tableHeaders],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
    });
    
    const pdfDataUri = doc.output('datauristring');

    return { pdfDataUri };
  }
);
