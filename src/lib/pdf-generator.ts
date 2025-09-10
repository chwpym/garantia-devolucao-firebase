'use client';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';
import type { Warranty, CompanyData, Supplier } from '@/lib/types';

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
    supplierData?: Supplier | null;
}

const formatCnpj = (cnpj: string | undefined): string => {
    if (!cnpj) return '';
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return cnpj;
    return cleaned.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
};

export function generatePdf(input: GeneratePdfInput): string {
    const { selectedWarranties, selectedFields, companyData, supplierData } = input;
    const doc = new jsPDF();
    const page_width = doc.internal.pageSize.getWidth();
    const margin = 14;
    let cursorY = 20;

    // --- CABEÇALHO ---

    // Linha 1: Nome da Empresa (esquerda) e Data (direita)
    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text(companyData?.nomeEmpresa || 'Relatório de Garantias', margin, cursorY);
    
    doc.setFontSize(10).setFont('helvetica', 'normal');
    const date = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${date}`, page_width - margin, cursorY, { align: 'right'});
    cursorY += 6;

    // Linha 2: Informações da Empresa
    doc.setFontSize(9);
    
    if (companyData?.cnpj) {
        doc.text(`CNPJ: ${formatCnpj(companyData.cnpj)}`, margin, cursorY);
        cursorY += 4;
    }

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
    
    let infoLine = '';
    if (companyData?.telefone) {
        infoLine += `Tel: ${companyData.telefone}`;
    }
    if (companyData?.email) {
        infoLine += `${infoLine ? ' | ' : ''}Email: ${companyData.email}`;
    }
    if (infoLine) {
        doc.text(infoLine, margin, cursorY);
    }
    
    // --- DADOS DO FORNECEDOR (se houver) ---
    if (supplierData) {
        cursorY += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('DESTINATÁRIO:', margin, cursorY);
        cursorY += 5;

        doc.setFont('helvetica', 'normal');
        doc.text(supplierData.nomeFantasia, margin, cursorY);
        if (supplierData.razaoSocial && supplierData.razaoSocial !== supplierData.nomeFantasia) {
            doc.text(`(${supplierData.razaoSocial})`, margin + doc.getTextWidth(supplierData.nomeFantasia) + 2, cursorY);
        }
        cursorY += 4;

        if (supplierData.cnpj) {
            doc.text(`CNPJ: ${formatCnpj(supplierData.cnpj)}`, margin, cursorY);
            cursorY += 4;
        }
         if (supplierData.cidade) {
            doc.text(`Cidade: ${supplierData.cidade}`, margin, cursorY);
        }
    }


    // Linha 3: Título do Relatório (Centralizado e com espaço)
    cursorY += 12; // Espaço extra antes do título
    doc.setFontSize(16).setFont('helvetica', 'bold');
    doc.text('Relatório de Garantias para Fornecedor', page_width / 2, cursorY, { align: 'center'});
    cursorY += 10;


    // --- TABELA ---
    
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
        startY: cursorY,
        head: [tableHeaders],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
    });
    
    return doc.output('datauristring');
}
