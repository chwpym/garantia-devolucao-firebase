'use client';

import { useState } from 'react';
import { generateFilteredWarrantyReport } from '@/ai/flows/generate-filtered-warranty-report';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, FileDown } from 'lucide-react';
import type { Warranty } from '@/lib/types';

const ALL_FIELDS: (keyof Omit<Warranty, 'id'>)[] = [
  'codigo', 'descricao', 'fornecedor', 'quantidade', 'defeito', 'requisicoes',
  'nfCompra', 'valorCompra', 'cliente', 'mecanico',
  'notaFiscalRetorno', 'observacao', 'status', 'dataRegistro'
];

const FIELD_LABELS: Record<keyof Omit<Warranty, 'id'>, string> = {
    codigo: 'Código',
    descricao: 'Descrição',
    fornecedor: 'Fornecedor',
    quantidade: 'Quantidade',
    defeito: 'Defeito',
    requisicoes: 'Requisições',
    nfCompra: 'NF Compra',
    valorCompra: 'Valor Compra',
    cliente: 'Cliente',
    mecanico: 'Mecânico',
    notaFiscalRetorno: 'NF Retorno',
    observacao: 'Observação',
    status: 'Status',
    dataRegistro: 'Data de Registro'
};

interface ReportGeneratorProps {
  selectedWarranties: Warranty[];
}

export default function ReportGenerator({ selectedWarranties }: ReportGeneratorProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'codigo', 'descricao', 'quantidade', 'defeito', 'cliente', 'status', 'fornecedor'
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleFieldSelection = (field: string, checked: boolean) => {
    setSelectedFields(prev =>
      checked ? [...prev, field] : prev.filter(f => f !== field)
    );
  };

  const handleGeneratePdf = async () => {
    if (selectedWarranties.length === 0) {
        toast({
            title: 'Nenhuma garantia selecionada',
            description: 'Por favor, selecione pelo menos uma garantia na tabela acima para gerar o relatório.',
            variant: 'destructive'
        });
        return;
    }
    if (selectedFields.length === 0) {
        toast({
            title: 'Nenhum campo selecionado',
            description: 'Por favor, selecione pelo menos um campo para incluir no relatório.',
            variant: 'destructive'
        });
        return;
    }

    setIsGenerating(true);
    try {
      // Remove id before sending to the flow
      const warrantiesToSend = selectedWarranties.map(({ id, ...rest }) => rest);

      const result = await generateFilteredWarrantyReport({
        selectedWarranties: warrantiesToSend,
        selectedFields,
      });
      
      if (result.pdfDataUri) {
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.href = result.pdfDataUri;
        link.download = `relatorio_garantias_${date}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: 'Sucesso',
          description: 'Seu relatório em PDF foi gerado e o download foi iniciado.',
        });
      } else {
        throw new Error('A resposta da API não continha um PDF.');
      }
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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Gerador de Relatório para Fornecedor</CardTitle>
        <CardDescription>Selecione os campos a serem incluídos no relatório em PDF.</CardDescription>
      </CardHeader>
      <CardContent>
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
          Gerar PDF para Fornecedor
        </Button>
        {(selectedWarranties.length === 0 || selectedFields.length === 0) && (
            <p className="text-sm text-muted-foreground mt-2">
                {selectedWarranties.length === 0 ? "Selecione pelo menos uma garantia na tabela para gerar o relatório." : "Selecione pelo menos um campo para incluir no relatório."}
            </p>
        )}
      </CardContent>
    </Card>
  );
}
