
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Devolucao, ItemDevolucao } from '@/lib/types';
import * as db from '@/lib/db';
import { generateDevolucoesPdf } from '@/lib/pdf-generator';
import { format, parseISO, addDays, startOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '../ui/status-badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Search, FileDown, ArrowUpDown, SearchX } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmptyState } from '../ui/empty-state';

import { Input } from '../ui/input';
import { smartSearch } from '@/lib/search-utils';
import { SearchInput } from '@/components/ui/search-input';
import { DatePickerWithRange } from '../ui/date-range-picker';
import { usePersistedFilters } from '@/hooks/use-persisted-filters';

type DevolucaoFlat = Omit<Devolucao, 'itens' | 'id'> & Partial<ItemDevolucao> & { id: number, itemId?: number };
type SortableKeys = keyof DevolucaoFlat;

interface DevolucaoQuerySectionProps {
    onEdit: (devolucaoId: number) => void;
}

export default function DevolucaoQuerySection({ onEdit }: DevolucaoQuerySectionProps) {
    const [devolucoes, setDevolucoes] = useState<DevolucaoFlat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(50);
    const initialFilters = useMemo(() => ({
        searchTerm: '',
        dateRange: { from: startOfMonth(new Date()), to: new Date() } as DateRange | undefined,
        sortConfig: { key: 'dataDevolucao' as SortableKeys, direction: 'descending' as 'ascending' | 'descending' }
    }), []);

    const { filters, setFilters } = usePersistedFilters('devolucao-query', initialFilters);

    const { searchTerm, dateRange, sortConfig } = filters;

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

            setDevolucoes(flatData);

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

        let filtered = devolucoes;

        if (dateRange?.from || dateRange?.to) {
            filtered = filtered.filter(item => {
                if (!item.dataDevolucao) return false;
                const itemDate = parseISO(item.dataDevolucao);
                if (dateRange.from && itemDate < dateRange.from) return false;
                const toDate = dateRange.to ? addDays(dateRange.to, 1) : null;
                if (toDate && itemDate >= toDate) return false;
                return true;
            });
        }


        if (lowercasedTerm) {
            filtered = filtered.filter(item =>
                smartSearch(item, searchTerm, ['cliente', 'mecanico', 'requisicaoVenda', 'codigoPeca', 'descricaoPeca', 'status'])
            );
        }

        return filtered;
    }, [searchTerm, devolucoes, dateRange]);

    const sortedDevolucoes = useMemo(() => {
        const sortableItems = [...filteredDevolucoes];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];

                if (valA === undefined || valA === null) return 1;
                if (valB === undefined || valB === null) return -1;

                let comparison = 0;
                if (typeof valA === 'string' && typeof valB === 'string') {
                    if (sortConfig.key === 'dataDevolucao' || sortConfig.key === 'dataVenda') {
                        comparison = parseISO(valA).getTime() - parseISO(valB).getTime();
                    } else {
                        comparison = valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' });
                    }
                } else if (typeof valA === 'number' && typeof valB === 'number') {
                    comparison = valA - valB;
                }

                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return sortableItems;
    }, [filteredDevolucoes, sortConfig]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setFilters({ ...filters, sortConfig: { key, direction } });
    };

    const getSortIcon = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-50" />;
        }
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };

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
        if (sortedDevolucoes.length === 0) {
            toast({ title: 'Aviso', description: 'Não há dados para exportar.' });
            return;
        }
        try {
            const companyData = await db.getCompanyData();
            const pdfDataUri = generateDevolucoesPdf({
                devolucoes: sortedDevolucoes,
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
        if (sortedDevolucoes.length === 0) {
            toast({ title: 'Aviso', description: 'Não há dados para exportar.' });
            return;
        }
        const headers = ['ID Dev.', 'Data Dev.', 'Cliente', 'Requisição', 'Código Peça', 'Descrição Peça', 'Qtd.', 'Ação Req.', 'Status'];
        const rows = sortedDevolucoes.map(item => [
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

    const SortableHeader = ({ sortKey, children }: { sortKey: SortableKeys, children: React.ReactNode }) => (
        <TableHead>
            <Button variant="ghost" onClick={() => requestSort(sortKey)} className="group px-2">
                {children}
                {getSortIcon(sortKey)}
            </Button>
        </TableHead>
    );

    return (
        <div className='space-y-8'>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Consulta de Devoluções</h1>
                <p className="text-lg text-muted-foreground">
                    Visualize, filtre e gerencie as devoluções registradas. Por padrão, são exibidos os últimos 30 dias.
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
                        <SearchInput
                            placeholder="Buscar por cliente, peça, requisição, etc..."
                            value={searchTerm}
                            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                            onClear={() => setFilters({ ...filters, searchTerm: '' })}
                            className="w-full"
                            containerClassName="relative flex-1 max-w-full"
                        />
                        <DatePickerWithRange
                            date={dateRange}
                            setDate={(range) => setFilters({ ...filters, dateRange: range })}
                        />
                    </div>
                    <div className="flex gap-2 mb-4">
                        <Button onClick={handleExportPdf} variant="outline" disabled={sortedDevolucoes.length === 0}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar para PDF
                        </Button>
                        <Button onClick={handleExportCsv} variant="outline" disabled={sortedDevolucoes.length === 0}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar para CSV
                        </Button>
                    </div>
                    <div className="space-y-4">
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableHeader sortKey="id">ID Dev.</SortableHeader>
                                        <SortableHeader sortKey="dataDevolucao">Data Dev.</SortableHeader>
                                        <SortableHeader sortKey="cliente">Cliente</SortableHeader>
                                        <SortableHeader sortKey="requisicaoVenda">Requisição</SortableHeader>
                                        <SortableHeader sortKey="codigoPeca">Código Peça</SortableHeader>
                                        <SortableHeader sortKey="descricaoPeca">Descrição Peça</SortableHeader>
                                        <SortableHeader sortKey="quantidade">Qtd.</SortableHeader>
                                        <SortableHeader sortKey="acaoRequisicao">Ação Req.</SortableHeader>
                                        <SortableHeader sortKey="status">Status</SortableHeader>
                                        <TableHead className="w-[50px] text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedDevolucoes.length > 0 ? (
                                        sortedDevolucoes.slice(0, visibleCount).map(item => (
                                            <TableRow key={`${item.id}-${item.itemId || 'no-item'}`}>
                                                <TableCell className="font-medium text-muted-foreground">{item.id}</TableCell>
                                                <TableCell>{item.dataDevolucao ? format(parseISO(item.dataDevolucao), 'dd/MM/yyyy') : '-'}</TableCell>
                                                <TableCell>{item.cliente}</TableCell>
                                                <TableCell>{item.requisicaoVenda}</TableCell>
                                                <TableCell className="font-medium">{item.codigoPeca || '-'}</TableCell>
                                                <TableCell>{item.descricaoPeca || '-'}</TableCell>
                                                <TableCell>{item.quantidade || '-'}</TableCell>
                                                <TableCell>
                                                    <StatusBadge type="acao" status={item.acaoRequisicao} />
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge type="devolucao" status={item.status} />
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
                                            <TableCell colSpan={10} className="py-12">
                                                {searchTerm || dateRange?.from ? (
                                                    <EmptyState 
                                                        icon={SearchX}
                                                        title="Nenhuma devolução encontrada"
                                                        description="Não encontramos registros para os filtros aplicados. Tente ajustar sua busca."
                                                        action={{
                                                            label: "Limpar Filtros",
                                                            onClick: () => setFilters(initialFilters)
                                                        }}
                                                    />
                                                ) : (
                                                    <EmptyState 
                                                        icon={Search}
                                                        title="Nenhuma devolução registrada"
                                                        description="Inicie uma busca ou aplique filtros para ver os registros de devolução."
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {visibleCount < sortedDevolucoes.length && (
                            <div className="flex justify-center pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setVisibleCount(prev => prev + 50)}
                                    className="w-full max-w-xs"
                                >
                                    Carregar Mais (Exibindo {visibleCount} de {sortedDevolucoes.length})
                                </Button>
                            </div>
                        )}

                        {sortedDevolucoes.length > 0 && visibleCount >= sortedDevolucoes.length && (
                            <p className="text-center text-xs text-muted-foreground">
                                Todos os {sortedDevolucoes.length} registros foram carregados.
                            </p>
                        )}
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
