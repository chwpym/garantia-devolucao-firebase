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
    const page_width = doc.internal.pageSize.getWidth();
    const margin = 14;
    let cursorY = 20;

    // Header
    // Company Name (left)
    if (companyData?.nomeEmpresa) {
        doc.setFontSize(14).setFont(undefined, 'bold');
        doc.text(companyData.nomeEmpresa, margin, cursorY);
        doc.setFont(undefined, 'normal');
        cursorY += 6;
    }

    // Report Title (centered)
    doc.setFontSize(16);
    doc.text('Relatório de Garantias para Fornecedor', page_width / 2, cursorY, { align: 'center'});
    cursorY -= 6; // Reset Y to align company info and date correctly

    // Generation Date (right)
    doc.setFontSize(10);
    const date = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${date}`, page_width - margin, cursorY, { align: 'right'});
    cursorY += 8;

    // Company Details (left)
    doc.setFontSize(9);
    if (companyData?.endereco) {
        let fullAddress = companyData.endereco;
        if (companyData.bairro) {
            fullAddress += `, ${companyData.bairro}`;
        }
        doc.text(fullAddress, margin, cursorY);
        cursorY += 4;
    }
    if (companyData?.cidade) {
        doc.text(companyData.cidade, margin, cursorY);
        cursorY += 4;
    }
    if (companyData?.telefone) {
        doc.text(`Tel: ${companyData.telefone}`, margin, cursorY);
        cursorY += 4;
    }
    if (companyData?.email) {
        doc.text(`Email: ${companyData.email}`, margin, cursorY);
    }
    
    // Define headers by mapping machine-readable field names to human-readable labels
    const FIELD_LABELS: Record<string, string> = {
        codigo: 'Código',
        descricao: 'Descrição',
        fornecedor: 'Fornecedor',
        quantidade: 'Qtd.',
        defeito: 'Defeito',
        requisicoes: 'Requisições',
        nfCompra: 'NF Compra',
        valorCompra: 'Valor Compra',
        cliente: 'Cliente',
        mecanico: 'Mecânico',
        notaFiscalSaida: 'NF Saída',
        notaFiscalRetorno: 'NF Retorno',
        observacao: 'Observação',
        status: 'Status',
        dataRegistro: 'Data Registro',
    };

    const tableHeaders = selectedFields.map(field => FIELD_LABELS[field] || field.replace(/([A-Z])/g, ' $1').toUpperCase());
    const tableBody = selectedWarranties.map(warranty => {
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
        startY: Math.max(cursorY, 45) + 5,
        head: [tableHeaders],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
    });
    
    return doc.output('datauristring');
}