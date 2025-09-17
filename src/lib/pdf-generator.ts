

'use client';

import { jsPDF, type GState } from 'jspdf';
import 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';
import type { Warranty, CompanyData, Supplier, Person, Devolucao, ItemDevolucao } from '@/lib/types';
import { format, parseISO } from 'date-fns';


// Extend jsPDF with autoTable, which is a plugin
declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: UserOptions) => jsPDF;
    }
}

export type ReportLayout = 'standard' | 'professional';
export type ReportOrientation = 'portrait' | 'landscape';

interface GeneratePdfInput {
    selectedWarranties: Omit<Warranty, 'id'>[];
    selectedFields: string[];
    companyData: CompanyData | null;
    supplierData?: Supplier | null;
    loteId?: number | null;
    layout?: ReportLayout;
    orientation?: ReportOrientation;
}

interface GeneratePersonsPdfInput {
    persons: Person[];
    companyData: CompanyData | null;
}

interface GenerateDevolucoesPdfInput {
    devolucoes: (Omit<Devolucao, 'id' | 'itens'> & Partial<ItemDevolucao> & { id: number; itemId?: number })[];
    companyData: CompanyData | null;
    title?: string;
}


const formatCnpj = (cnpj: string | undefined): string => {
    if (!cnpj) return '';
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length === 11) { // CPF
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (cleaned.length === 14) { // CNPJ
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
};


const addStandardHeader = (doc: jsPDF, companyData: CompanyData | null, title: string) => {
    const page_width = doc.internal.pageSize.getWidth();
    const margin = 14;
    let cursorY = 20;

    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text(companyData?.nomeEmpresa || 'Relatório', margin, cursorY);
    
    doc.setFontSize(10).setFont('helvetica', 'normal');
    const date = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${date}`, page_width - margin, cursorY, { align: 'right'});
    cursorY += 6;

    doc.setFontSize(9);
    
    if (companyData?.cnpj) {
        doc.text(`CNPJ: ${formatCnpj(companyData.cnpj)}`, margin, cursorY);
        cursorY += 4;
    }
    if (companyData?.endereco) {
        doc.text(`${companyData.endereco}, ${companyData.bairro || ''}`, margin, cursorY);
        cursorY += 4;
    }
    if (companyData?.cidade) {
        doc.text(companyData.cidade, margin, cursorY);
        cursorY += 4;
    }
    
    let infoLine = '';
    if (companyData?.telefone) infoLine += `Tel: ${companyData.telefone}`;
    if (companyData?.email) infoLine += `${infoLine ? ' | ' : ''}Email: ${companyData.email}`;
    if (infoLine) doc.text(infoLine, margin, cursorY);

    cursorY += 12;
    doc.setFontSize(16).setFont('helvetica', 'bold');
    doc.text(title, page_width / 2, cursorY, { align: 'center'});
    cursorY += 10;
    
    return cursorY;
}

const addProfessionalHeader = (doc: jsPDF, companyData: CompanyData | null, loteId: number | null | undefined) => {
    const margin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();
    let cursorY = 15;

    // --- Company Info ---
    if (companyData?.nomeEmpresa) {
        doc.setFontSize(16).setFont('helvetica', 'bold');
        doc.text(companyData.nomeEmpresa, pageWidth / 2, cursorY, { align: 'center' });
        cursorY += 8;
    }
    doc.setFontSize(9).setFont('helvetica', 'normal');
    if (companyData?.cnpj) {
        doc.text(`CNPJ: ${formatCnpj(companyData.cnpj)}`, pageWidth / 2, cursorY, { align: 'center' });
        cursorY += 4;
    }
    if (companyData?.endereco) {
        doc.text(`${companyData.endereco}, ${companyData.bairro || ''}`, pageWidth / 2, cursorY, { align: 'center' });
        cursorY += 4;
    }
    if (companyData?.cidade) {
        doc.text(`${companyData.cidade} - CEP: ${companyData.cep || ''}`, pageWidth / 2, cursorY, { align: 'center' });
    }

    // --- Pagination ---
    doc.setFontSize(9).setFont('helvetica', 'normal');
    const pageStr = `Pág. ${doc.getNumberOfPages()}`;
    doc.text(pageStr, pageWidth - margin, 15);
    
    cursorY += 4; // Gap after company data
    
    // --- Report Title Section ---
    const sectionHeight = 10;
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, cursorY, pageWidth - margin, cursorY); // Top line
    doc.line(margin, cursorY, margin, cursorY + sectionHeight); // Left line
    doc.line(pageWidth - margin, cursorY, pageWidth - margin, cursorY + sectionHeight); // Right line
    
    const dateText = `Data: ${new Date().toLocaleDateString('pt-BR')}`;
    const idText = `Lote ID: ${loteId || 'N/A'}`;
    const dateWidth = doc.getTextWidth(dateText);
    const idWidth = doc.getTextWidth(idText);

    const title = 'SOLICITAÇÃO DE AVALIAÇÃO DE GARANTIA';
    const titleBoxWidth = pageWidth - (margin * 2) - dateWidth - idWidth - 30; // 30 for padding
    const dateBoxX = margin + titleBoxWidth + 10;
    const idBoxX = dateBoxX + dateWidth + 10;

    doc.line(dateBoxX - 5, cursorY, dateBoxX - 5, cursorY + sectionHeight);
    doc.line(idBoxX - 5, cursorY, idBoxX - 5, cursorY + sectionHeight);
    
    doc.setFontSize(11).setFont('helvetica', 'bold');
    doc.text(title, margin + titleBoxWidth / 2, cursorY + sectionHeight / 2 + 2, { align: 'center' });
    
    doc.setFontSize(9).setFont('helvetica', 'normal');
    doc.text(dateText, dateBoxX, cursorY + sectionHeight / 2 + 2);
    doc.text(idText, idBoxX, cursorY + sectionHeight / 2 + 2);

    cursorY += sectionHeight;
    doc.line(margin, cursorY, pageWidth - margin, cursorY); // Bottom line
    
    return cursorY + 4;
};


export function generatePdf(input: GeneratePdfInput): string {
    const { 
        selectedWarranties, 
        selectedFields, 
        companyData, 
        supplierData, 
        loteId,
        layout = 'standard',
        orientation = 'portrait'
    } = input;

    const doc = new jsPDF({ orientation });
    const margin = 14;
    let startY = 0;

    const addPageNumbers = () => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageText = `Página ${i} de ${pageCount}`;
            doc.text(pageText, doc.internal.pageSize.getWidth() - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
        }
    }

    if (layout === 'professional') {
        startY = addProfessionalHeader(doc, companyData, loteId);
    } else {
        startY = addStandardHeader(doc, companyData, 'Relatório de Garantias');
    }

    if (supplierData) {
        doc.setFontSize(10).setFont('helvetica', 'bold');
        doc.text('DESTINATÁRIO:', margin, startY);
        startY += 4; 

        doc.setFontSize(9).setFont('helvetica', 'normal');
        doc.text(supplierData.nomeFantasia, margin, startY);
        if (supplierData.razaoSocial && supplierData.razaoSocial !== supplierData.nomeFantasia) {
            doc.text(`(${supplierData.razaoSocial})`, margin + doc.getTextWidth(supplierData.nomeFantasia) + 2, startY);
        }
        startY += 4;

        if (supplierData.cnpj) {
            doc.text(`CNPJ: ${formatCnpj(supplierData.cnpj)}`, margin, startY);
            startY += 4;
        }
         if (supplierData.cidade) {
            doc.text(`Cidade: ${supplierData.cidade}`, margin, startY);
        }
        startY += 4; 
    }
    
    const FIELD_LABELS: Record<string, string> = {
        codigo: 'Código', descricao: 'Descrição', fornecedor: 'Fornecedor', quantidade: 'Qtd.',
        defeito: 'Defeito', requisicaoVenda: 'Req. Venda', requisicoesGarantia: 'Req. Garantia',
        nfCompra: 'NF Compra', valorCompra: 'Valor Compra', cliente: 'Cliente', mecanico: 'Mecânico',
        notaFiscalSaida: 'NF Saída', notaFiscalRetorno: 'NF Retorno', observacao: 'Observação',
        status: 'Status', dataRegistro: 'Data Registro',
    };

    const tableHeaders = selectedFields.map(field => FIELD_LABELS[field] || field.replace(/([A-Z])/g, ' $1').toUpperCase());
    const tableBody = selectedWarranties.map(warranty => {
        const warrantyRecord = warranty as Record<string, string | number | boolean | null | undefined>;
        return selectedFields.map(field => {
            const key = field as keyof Omit<Warranty, 'id'>;
            const value = warrantyRecord[key];
            if (key === 'dataRegistro' && typeof value === 'string') {
                return format(parseISO(value), 'dd/MM/yyyy');
            }
            return value?.toString() || '-';
        });
    });

    doc.autoTable({
        startY: startY,
        head: [tableHeaders],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        didDrawPage: (data) => {
            if (layout === 'professional' && data.pageNumber > 1) {
                 addProfessionalHeader(doc, companyData, loteId);
            }
        }
    });

    if (layout === 'professional') {
        const finalY = (doc as any).lastAutoTable.finalY || startY;
        doc.setFontSize(10).setFont('helvetica', 'bold');
        doc.text(`Total de Itens: ${selectedWarranties.length}`, margin, finalY + 10);
    }


    if(layout === 'standard') {
        addPageNumbers();
    }


    return doc.output('datauristring');
}


export function generatePersonsPdf(input: GeneratePersonsPdfInput): string {
    const { persons, companyData } = input;
    const doc = new jsPDF();
    
    const startY = addStandardHeader(doc, companyData, 'Relatório de Clientes e Mecânicos');

    const tableHeaders = ['Nome / Razão Social', 'CPF/CNPJ', 'Telefone', 'Email', 'Cidade', 'Tipo'];
    
    const tableBody = persons.map(person => [
        person.nome || '-',
        formatCnpj(person.cpfCnpj) || '-',
        person.telefone || '-',
        person.email || '-',
        person.cidade || '-',
        person.tipo || '-',
    ]);

    doc.autoTable({
        startY: startY,
        head: [tableHeaders],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    return doc.output('datauristring');
}

export function generateDevolucoesPdf(input: GenerateDevolucoesPdfInput): string {
    const { devolucoes, companyData, title: customTitle } = input;
    const doc = new jsPDF();
    
    const isClientReport = customTitle?.includes('Relatório de Devoluções -');
    const title = customTitle || 'Relatório de Devoluções';

    const startY = addStandardHeader(doc, companyData, title);
    
    const baseHeaders = ['Data Dev.', 'Cliente', 'Requisição', 'Código Peça', 'Descrição Peça', 'Qtd.', 'Ação Req.', 'Status'];

    const tableHeaders = isClientReport
      ? ['Data Dev.', 'Requisição', 'Código Peça', 'Descrição Peça', 'Qtd.']
      : baseHeaders;


    const tableBody = devolucoes.map(item => {
        const fullRow = [
            item.dataDevolucao ? format(parseISO(item.dataDevolucao), 'dd/MM/yyyy') : '-',
            item.cliente || '-',
            item.requisicaoVenda || '-',
            item.codigoPeca || '-',
            item.descricaoPeca || '-',
            item.quantidade?.toString() || '-',
            item.acaoRequisicao || '-',
            item.status || '-',
        ];

        if (isClientReport) {
            return [fullRow[0], fullRow[2], fullRow[3], fullRow[4], fullRow[5]];
        }

        return fullRow;
    });

    doc.autoTable({
        startY: startY,
        head: [tableHeaders],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    return doc.output('datauristring');
}
