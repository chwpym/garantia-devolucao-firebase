'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Devolucao, ItemDevolucao } from '@/lib/types';
import * as db from '@/lib/db';
import { generateDevolucoesPdf } from '@/lib/pdf-generator';
import { format, parseISO, addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Search, FileDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { Input } from '../ui/input';
import { DatePickerWithRange } from '../ui/date-range-picker';

type DevolucaoFlat = Omit<Devolucao, 'itens' | 'id'> & Partial<ItemDevolucao> & { id: number, itemId?: number };

interface DevolucaoQuerySectionProps {
    onEdit: (devolucaoId: number) => void;
}

export default function DevolucaoQuerySection({ onEdit }: DevolucaoQuerySectionProps) {
  const [devolucoes, setDevolucoes] = useState<DevolucaoFlat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<DevolucaoFlat | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await db.initDB();
      const data = await db.getAllDevolucoes();
      
      const flatData = data.flatMap(devolucao => {
        if (!devolucao.itens || data.length === 0) {
            return [{
                ...devolucao,
                id: devolucao.id!,
            }];
        }
        return devolucao.itens.map(item => ({
            ...devolucao,
            ...item,
            id: devolucao.id!,
            itemId: item.id!,
        }));
      });

      setDevolucoes(flatData.sort((a,b) => (b.dataDevolucao && a.dataDevolucao) ? (parseISO(b.dataDevolucao).getTime() - parseISO(a.dataDevolucao).getTime()) : 0));
      
    } catch (error) {
      console.error('Failed to load devolutions:', error);
      toast({
        title: 'Erro ao Carregar',
        description: 'Não foi possível carregar as devoluções.',
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  const refreshData = useCallback(() => {
    loadData();
    window.dispatchEvent(new CustomEvent('datachanged'));
  }, [loadData]);


  useEffect(() => {
    loadData();
    window.addEventListener('datachanged', refreshData);
    return () => window.removeEventListener('datachanged', refreshData);
  }, [loadData, refreshData]);
  
  const filteredDevolucoes = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    
    return devolucoes.filter(item => {
      // Date filter
      const { from, to } = dateRange || {};
      if (from && item.dataDevolucao) {
        if (parseISO(item.dataDevolucao) < from) return false;
      }
      if (to && item.dataDevolucao) {
        const toDate = addDays(to, 1);
        if (parseISO(item.dataDevolucao) >= toDate) return false;
      }
      
      // Search term filter
      if (!lowercasedTerm) {
        return true;
      }
      return (
        item.cliente?.toLowerCase().includes(lowercasedTerm) ||
        item.mecanico?.toLowerCase().includes(lowercasedTerm) ||
        item.requisicaoVenda?.toLowerCase().includes(lowercasedTerm) ||
        item.codigoPeca?.toLowerCase().includes(lowercasedTerm) ||
        item.descricaoPeca?.toLowerCase().includes(lowercasedTerm) ||
        item.status?.toLowerCase().includes(lowercasedTerm)
      );
    });
  }, [searchTerm, devolucoes, dateRange]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
        await db.deleteDevolucao(deleteTarget.id);
        toast({
            title: 'Sucesso',
            description: 'Devolução excluída com sucesso.',
        });
        setDeleteTarget(null);
        refreshData();
    } catch (error) {
        console.error('Failed to delete devolution:', error);
        toast({
            title: 'Erro ao Excluir',
            description: 'Não foi possível excluir a devolução.',
            variant: 'destructive',
        });
    }
  };

  const handleExportPdf = async () => {
    if (filteredDevolucoes.length === 0) {
        toast({ title: 'Aviso', description: 'Não há dados para exportar.'});
        return;
    }
    try {
        const companyData = await db.getCompanyData();
        const pdfDataUri = generateDevolucoesPdf({
            devolucoes: filteredDevolucoes,
            companyData,
        });
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.href = pdfDataUri;
        link.download = `relatorio_devolucoes_${date}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: 'Sucesso',
          description: 'Seu relatório de devoluções foi gerado.',
        });
    } catch (error) {
        console.error('Failed to generate PDF:', error);
        toast({
            title: 'Erro ao Gerar PDF',
            description: 'Não foi possível gerar o relatório. Tente novamente.',
            variant: 'destructive',
        });
    }
  };

  const handleExportCsv = () => {
    if (filteredDevolucoes.length === 0) {
        toast({ title: 'Aviso', description: 'Não há dados para exportar.'});
        return;
    }
    const headers = ['ID Dev.','Data Dev.', 'Cliente', 'Requisição', 'Código Peça', 'Descrição Peça', 'Qtd.', 'Ação Req.', 'Status'];
    const rows = filteredDevolucoes.map(item => [
      item.id,
      item.dataDevolucao ? format(parseISO(item.dataDevolucao), 'dd/MM/yyyy') : '',
      `"${item.cliente || ''}"`,
      `"${item.requisicaoVenda || ''}"`,
      `"${item.codigoPeca || ''}"`,
      `"${item.descricaoPeca || ''}"`,
      item.quantidade || 0,
      `"${item.acaoRequisicao || ''}"`,
      `"${item.status || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `devolucoes_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Sucesso', description: 'Arquivo CSV gerado.' });
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className='space-y-8'>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Consulta de Devoluções</h1>
            <p className="text-lg text-muted-foreground">
                Visualize, filtre e gerencie as devoluções registradas.
            </p>
        </div>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Devoluções Registradas</CardTitle>
                <CardDescription>
                   Cada linha representa um item dentro de uma devolução. Use os filtros para refinar sua busca.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por cliente, peça, requisição, etc..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10"
                        />
                    </div>
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                </div>
                <div className="flex gap-2 mb-4">
                    <Button onClick={handleExportPdf} variant="outline" disabled={filteredDevolucoes.length === 0}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar para PDF
                    </Button>
                     <Button onClick={handleExportCsv} variant="outline" disabled={filteredDevolucoes.length === 0}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar para CSV
                    </Button>
                </div>
                <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">ID Dev.</TableHead>
                            <TableHead>Data Dev.</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Requisição</TableHead>
                            <TableHead>Código Peça</TableHead>
                            <TableHead>Descrição Peça</TableHead>
                            <TableHead>Qtd.</TableHead>
                            <TableHead>Ação Req.</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDevolucoes.length > 0 ? (
                            filteredDevolucoes.map(item => (
                                <TableRow key={`${item.id}-${item.itemId || 'no-item'}`}>
                                    <TableCell className="font-medium text-muted-foreground">{item.id}</TableCell>
                                    <TableCell>{item.dataDevolucao ? format(parseISO(item.dataDevolucao), 'dd/MM/yyyy') : '-'}</TableCell>
                                    <TableCell>{item.cliente}</TableCell>
                                    <TableCell>{item.requisicaoVenda}</TableCell>
                                    <TableCell className="font-medium">{item.codigoPeca || '-'}</TableCell>
                                    <TableCell>{item.descricaoPeca || '-'}</TableCell>
                                    <TableCell>{item.quantidade || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.acaoRequisicao === 'Excluída' ? 'destructive' : 'secondary'}>
                                            {item.acaoRequisicao}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(item.id)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar / Detalhes
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDeleteTarget(item)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center">
                                    Nenhuma devolução encontrada para os filtros selecionados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                    Tem certeza que deseja excluir esta devolução? Todos os itens associados a ela também serão removidos. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                    Excluir
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
