'use client';

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

interface GeneratePdfInput {
    selectedWarranties: Omit<Warranty, 'id'>[];
    selectedFields: string[];
    companyData: CompanyData | null;
}

export function generatePdf(input: GeneratePdfInput): string {
    const { selectedWarranties, selectedFields, companyData } = input;
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
            const value = warrantyRecord[key];

            if (key === 'dataRegistro' && typeof value === 'string') {
                try {
                    return new Date(value).toLocaleDateString('pt-BR');
                } catch(e) {
                    return value;
                }
            }
            return value?.toString() || '-';
        });
    });

    doc.autoTable({
        startY: headerY + 10 > 45 ? headerY + 10 : 45,
        head: [tableHeaders],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
    });
    
    return doc.output('datauristring');
}