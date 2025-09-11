'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileDown, Loader2 } from 'lucide-react';
import type { Devolucao, ItemDevolucao } from '@/lib/types';
import { format } from 'date-fns';

type DataType = 'warranties' | 'devolutions' | 'persons' | 'suppliers';

const FIELD_CONFIG: Record<DataType, Record<string, string>> = {
  warranties: {
    id: 'ID',
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
    dataRegistro: 'Data de Registro',
    status: 'Status',
    loteId: 'ID do Lote',
  },
  devolutions: {
    id: 'ID Devolução',
    cliente: 'Cliente',
    mecanico: 'Mecânico',
    requisicaoVenda: 'Requisição Venda',
    acaoRequisicao: 'Ação Requisição',
    dataVenda: 'Data Venda',
    dataDevolucao: 'Data Devolução',
    status: 'Status',
    observacaoGeral: 'Obs. Geral',
    codigoPeca: 'Código Peça',
    descricaoPeca: 'Descrição Peça',
    quantidade: 'Quantidade Peça',
  },
  persons: {
    id: 'ID',
    nome: 'Nome',
    tipo: 'Tipo',
    cpfCnpj: 'CPF/CNPJ',
    telefone: 'Telefone',
    email: 'Email',
    cep: 'CEP',
    endereco: 'Endereço',
    bairro: 'Bairro',
    cidade: 'Cidade/UF',
    observacao: 'Observação',
  },
  suppliers: {
    id: 'ID',
    razaoSocial: 'Razão Social',
    nomeFantasia: 'Nome Fantasia',
    cnpj: 'CNPJ',
    cidade: 'Cidade/UF',
  },
};

export default function CsvExporter() {
  const [dataType, setDataType] = useState<DataType>('warranties');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const availableFields = FIELD_CONFIG[dataType];
    setFields(availableFields);
    setSelectedFields(Object.keys(availableFields));
  }, [dataType]);

  const handleFieldSelection = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleSelectAll = () => {
    if (selectedFields.length === Object.keys(fields).length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(Object.keys(fields));
    }
  };

  const fetchData = useCallback(async () => {
    switch (dataType) {
      case 'warranties':
        return db.getAllWarranties();
      case 'persons':
        return db.getAllPersons();
      case 'suppliers':
        return db.getAllSuppliers();
      case 'devolutions': {
        const devolucoes: Devolucao[] = await db.getAllDevolucoes();
        return devolucoes.flatMap(devolucao => {
            if (!devolucao.itens || devolucoes.length === 0) {
                return [{ ...devolucao, id: devolucao.id! }];
            }
            return devolucao.itens.map((item: ItemDevolucao) => ({
                ...devolucao, ...item, id: devolucao.id!, itemId: item.id!,
            }));
        });
      }
      default:
        return [];
    }
  }, [dataType]);
  
  const formatValueForCsv = (value: unknown): string => {
    if (value === null || value === undefined) {
        return '';
    }
    const strValue = String(value);
    // If the value contains a comma, a quote, or a newline, wrap it in double quotes.
    if (/[",\n\r]/.test(strValue)) {
        return `"${strValue.replace(/"/g, '""')}"`;
    }
    return strValue;
  }

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast({
        title: 'Nenhum campo selecionado',
        description: 'Por favor, selecione pelo menos um campo para exportar.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchData();

      if (data.length === 0) {
        toast({ title: 'Nenhum dado', description: 'Não há dados para exportar nesta categoria.' });
        return;
      }
      
      // Use the labels for headers
      const headers = selectedFields.map(fieldKey => fields[fieldKey]);
      
      const rows = data.map(item => {
        return selectedFields.map(fieldKey => {
            const value = (item as Record<string, unknown>)[fieldKey];
            if ((fieldKey === 'dataRegistro' || fieldKey === 'dataVenda' || fieldKey === 'dataDevolucao') && value) {
                return format(new Date(value as string | number), 'dd/MM/yyyy HH:mm');
            }
            return formatValueForCsv(value);
        }).join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Exportação Concluída',
        description: `${data.length} registros foram exportados com sucesso.`,
      });
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast({
        title: 'Erro na Exportação',
        description: 'Não foi possível exportar os dados. Verifique o console para detalhes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="dataTypeSelect">1. Selecione o que deseja exportar</Label>
          <Select value={dataType} onValueChange={(value) => setDataType(value as DataType)}>
            <SelectTrigger id="dataTypeSelect">
              <SelectValue placeholder="Selecione o tipo de dado..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warranties">Garantias</SelectItem>
              <SelectItem value="devolutions">Devoluções</SelectItem>
              <SelectItem value="persons">Clientes e Mecânicos</SelectItem>
              <SelectItem value="suppliers">Fornecedores</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>2. Selecione os campos a serem incluídos no arquivo</Label>
        <div className="border rounded-md p-4 mt-2 space-y-2">
           <div className="flex items-center space-x-2">
                <Checkbox
                    id="select-all"
                    checked={selectedFields.length === Object.keys(fields).length}
                    onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="font-bold">Selecionar Tudo</Label>
            </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-60 overflow-y-auto">
            {Object.entries(fields).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`field-${key}`}
                  checked={selectedFields.includes(key)}
                  onCheckedChange={() => handleFieldSelection(key)}
                />
                <Label htmlFor={`field-${key}`} className="font-normal cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Button onClick={handleExport} disabled={isLoading || selectedFields.length === 0}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Exportar para CSV
        </Button>
      </div>
    </div>
  );
}
