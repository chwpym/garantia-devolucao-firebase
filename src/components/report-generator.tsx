'use client';

import { useState } from 'react';
import { generateFilteredWarrantyReport } from '@/ai/flows/generate-filtered-warranty-report';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, FileDown } from 'lucide-react';

const ALL_FIELDS = [
  'codigo', 'descricao', 'quantidade', 'defeito', 'requisicaoVenda',
  'requisicaoGarantia', 'nfCompra', 'valorCompra', 'cliente', 'mecanico',
  'notaRetorno', 'observacao'
];

interface ReportGeneratorProps {
  selectedWarrantyIds: string[];
}

export default function ReportGenerator({ selectedWarrantyIds }: ReportGeneratorProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>(ALL_FIELDS);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleFieldSelection = (field: string, checked: boolean) => {
    setSelectedFields(prev =>
      checked ? [...prev, field] : prev.filter(f => f !== field)
    );
  };

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    try {
      const result = await generateFilteredWarrantyReport({
        selectedWarrantyIds,
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
        <CardTitle>Relatório para Fornecedor</CardTitle>
        <CardDescription>Selecione os campos a serem incluídos no relatório em PDF.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {ALL_FIELDS.map(field => (
            <div key={field} className="flex items-center space-x-2">
              <Checkbox
                id={field}
                checked={selectedFields.includes(field)}
                onCheckedChange={checked => handleFieldSelection(field, !!checked)}
              />
              <Label htmlFor={field} className="capitalize text-sm font-normal cursor-pointer">
                {field.replace(/([A-Z])/g, ' $1')}
              </Label>
            </div>
          ))}
        </div>
        <Button 
          onClick={handleGeneratePdf}
          disabled={isGenerating || selectedWarrantyIds.length === 0 || selectedFields.length === 0}
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Gerar PDF para Fornecedor
        </Button>
        {(selectedWarrantyIds.length === 0 || selectedFields.length === 0) && (
            <p className="text-sm text-muted-foreground mt-2">
                {selectedWarrantyIds.length === 0 ? "Selecione pelo menos uma garantia na tabela para gerar o relatório." : "Selecione pelo menos um campo para incluir no relatório."}
            </p>
        )}
      </CardContent>
    </Card>
  );
}
