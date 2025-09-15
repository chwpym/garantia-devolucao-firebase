'use client';

import { jsPDF } from 'jspdf';
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

interface GeneratePdfInput {
    selectedWarranties: Omit<Warranty, 'id'>[];
    selectedFields: string[];
    companyData: CompanyData | null;
    supplierData?: Supplier | null;
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

const addHeader = (doc: jsPDF, companyData: CompanyData | null, title: string) => {
    const page_width = doc.internal.pageSize.getWidth();
    const margin = 14;
    let cursorY = 20;

    // Linha 1: Nome da Empresa (esquerda) e Data (direita)
    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text(companyData?.nomeEmpresa || 'Relatório', margin, cursorY);
    
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

    // Linha 3: Título do Relatório (Centralizado e com espaço)
    cursorY += 12; // Espaço extra antes do título
    doc.setFontSize(16).setFont('helvetica', 'bold');
    doc.text(title, page_width / 2, cursorY, { align: 'center'});
    cursorY += 10;
    
    return cursorY;
}


export function generatePdf(input: GeneratePdfInput): string {
    const { selectedWarranties, selectedFields, companyData, supplierData } = input;
    const doc = new jsPDF();
    const margin = 14;

    let cursorY = addHeader(doc, companyData, 'Relatório de Garantias');

    // --- DADOS DO FORNECEDOR (se houver) ---
    if (supplierData) {
        doc.setFontSize(10).setFont('helvetica', 'bold');
        doc.text('DESTINATÁRIO:', margin, cursorY);
        cursorY += 5;

        doc.setFontSize(9).setFont('helvetica', 'normal');
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
        cursorY += 6;
    }


    // --- TABELA ---
    
    const FIELD_LABELS: Record<string, string> = {
        codigo: 'Código',
        descricao: 'Descrição',
        fornecedor: 'Fornecedor',
        quantidade: 'Qtd.',
        defeito: 'Defeito',
        requisicaoVenda: 'Req. Venda',
        requisicoesGarantia: 'Req. Garantia',
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
                } catch {
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


export function generatePersonsPdf(input: GeneratePersonsPdfInput): string {
    const { persons, companyData } = input;
    const doc = new jsPDF();
    
    const startY = addHeader(doc, companyData, 'Relatório de Clientes e Mecânicos');

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

    const startY = addHeader(doc, companyData, title);
    
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
            // Reorder to match headers: 'Data Dev.', 'Requisição', 'Código Peça', 'Descrição Peça', 'Qtd.'
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
