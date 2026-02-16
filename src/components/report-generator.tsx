'use client';

import { useState } from 'react';
import { generatePdf, type ReportLayout, type ReportOrientation } from '@/lib/pdf-generator';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, FileDown } from 'lucide-react';
import type { Warranty, Supplier } from '@/lib/types';
import * as db from '@/lib/db';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const ALL_FIELDS: (keyof Omit<Warranty, 'id' | 'photos'>)[] = [
  'codigo', 'descricao', 'fornecedor', 'quantidade', 'defeito', 'requisicaoVenda', 'requisicoesGarantia',
  'nfCompra', 'valorCompra', 'cliente', 'mecanico', 'notaFiscalSaida',
  'notaFiscalRetorno', 'observacao', 'status', 'dataRegistro', 'codigoExterno'
];

const FIELD_LABELS: Record<keyof Omit<Warranty, 'id' | 'loteId' | 'photos'>, string> = {
  codigo: 'Código',
  descricao: 'Descrição',
  fornecedor: 'Fornecedor',
  quantidade: 'Quantidade',
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
  dataRegistro: 'Data de Registro',
  codigoExterno: 'Cód. Externo',
};

interface ReportGeneratorProps {
  selectedWarranties: Warranty[];
  title?: string;
  description?: string;
  supplierData?: Supplier | null;
  defaultFields?: string[];
  loteId?: number | null;
}

export default function ReportGenerator({
  selectedWarranties,
  title = "Gerador de Relatório",
  description = "Selecione os campos a serem incluídos no relatório em PDF.",
  supplierData,
  defaultFields = ['codigo', 'descricao', 'quantidade', 'defeito', 'cliente', 'status', 'fornecedor'],
  loteId
}: ReportGeneratorProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>(defaultFields);
  const [layout, setLayout] = useState<ReportLayout>('standard');
  const [orientation, setOrientation] = useState<ReportOrientation>('portrait');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleFieldSelection = (field: string, checked: boolean) => {
    setSelectedFields(prev =>
      checked ? [...prev, field] : prev.filter(f => f !== field)
    );
  };

  const handleGeneratePdf = async () => {
    if (selectedWarranties.length === 0 || selectedFields.length === 0) {
      toast({
        title: 'Ação Inválida',
        description: selectedWarranties.length === 0
          ? 'Nenhuma garantia selecionada para gerar o relatório.'
          : 'Selecione pelo menos um campo para incluir no relatório.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const companyData = await db.getCompanyData();

      const warrantiesToSend = selectedWarranties.map((w) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, ...rest } = w;
        return rest;
      });

      const pdfDataUri = generatePdf({
        selectedWarranties: warrantiesToSend,
        selectedFields,
        companyData,
        supplierData,
        loteId,
        layout,
        orientation
      });

      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      const supplierName = supplierData?.nomeFantasia.replace(/\s+/g, '_') || 'relatorio';
      link.href = pdfDataUri;
      link.download = `relatorio_garantias_${supplierName}_${date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: 'Sucesso',
        description: 'Seu relatório em PDF foi gerado e o download foi iniciado.',
      });

    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast({
        title: 'Erro ao Gerar PDF',
        description: 'Não foi possível gerar o relatório. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const Wrapper = title ? Card : 'div';
  const header = title ? (
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  ) : null;


  return (
    <Wrapper>
      {header}
      <CardContent className={!title ? 'p-0' : ''}>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-6 mb-6'>
          <div>
            <Label htmlFor="layout-select">Layout do Relatório</Label>
            <Select value={layout} onValueChange={(v) => setLayout(v as ReportLayout)}>
              <SelectTrigger id='layout-select'><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Padrão</SelectItem>
                <SelectItem value="professional">Profissional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="orientation-select">Orientação da Página</Label>
            <Select value={orientation} onValueChange={(v) => setOrientation(v as ReportOrientation)}>
              <SelectTrigger id='orientation-select'><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Retrato</SelectItem>
                <SelectItem value="landscape">Paisagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {ALL_FIELDS.map(field => (
            <div key={field} className="flex items-center space-x-2">
              <Checkbox
                id={`field-${field}`}
                checked={selectedFields.includes(field)}
                onCheckedChange={checked => handleFieldSelection(field, !!checked)}
              />
              <Label htmlFor={`field-${field}`} className="capitalize text-sm font-normal cursor-pointer">
                {FIELD_LABELS[field as keyof typeof FIELD_LABELS]}
              </Label>
            </div>
          ))}
        </div>
        <Button
          onClick={handleGeneratePdf}
          disabled={isGenerating || selectedWarranties.length === 0 || selectedFields.length === 0}
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Gerar PDF
        </Button>
        {(selectedWarranties.length === 0 || selectedFields.length === 0) && (
          <p className="text-sm text-muted-foreground mt-2">
            {selectedWarranties.length === 0 ? "Nenhuma garantia disponível para gerar o relatório." : "Selecione pelo menos um campo para incluir no relatório."}
          </p>
        )}
      </CardContent>
    </Wrapper>
  );
}

