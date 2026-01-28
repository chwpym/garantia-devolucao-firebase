
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Warranty, Lote, Person } from '@/lib/types';
import * as db from '@/lib/db';
import { Search, PlusCircle, FilterX, MoreHorizontal, Hourglass, Send, DollarSign, XCircle } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

import WarrantyTable from '@/components/warranty-table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Button } from '../ui/button';
import AddToLoteDialog from '../add-to-lote-dialog';
import { Combobox } from '../ui/combobox';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { smartSearch } from '@/lib/search-utils';
import { SearchInput } from '@/components/ui/search-input';
import { usePersistedFilters } from '@/hooks/use-persisted-filters';


interface QuerySectionProps {
  setActiveView: (view: string) => void;
  onEdit: (warranty: Warranty) => void;
  onClone: (warranty: Warranty) => void;
}

type SortableKeys = keyof Warranty;

export default function QuerySection({ setActiveView, onEdit, onClone }: QuerySectionProps) {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [openLotes, setOpenLotes] = useState<Lote[]>([]);
  const [isLoteDialogOpen, setIsLoteDialogOpen] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const initialFilters = useMemo(() => ({
    searchTerm: '',
    dateRange: { from: new Date(new Date().setDate(new Date().getDate() - 30)), to: new Date() } as DateRange | undefined,
    clientFilter: '',
    showInLote: false,
    sortConfig: { key: 'id' as SortableKeys, direction: 'descending' as 'ascending' | 'descending' }
  }), []);

  const { filters, setFilters } = usePersistedFilters('query-warranties', initialFilters);
  const { searchTerm, dateRange, clientFilter, showInLote, sortConfig } = filters;

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const [allWarranties, allLotes, allPersons] = await Promise.all([
        db.getAllWarranties(),
        db.getAllLotes(),
        db.getAllPersons()
      ]);
      setWarranties(allWarranties);
      setOpenLotes(allLotes.filter(l => l.status === 'Aberto'));
      setPersons(allPersons);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Erro ao Carregar',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const refreshData = useCallback(() => {
    loadData();
    setSelectedIds(new Set());
    window.dispatchEvent(new CustomEvent('datachanged'));
  }, [loadData]);


  useEffect(() => {
    async function initializeDB() {
      if (isDbReady) {
        loadData();
        return;
      }
      try {
        await db.initDB();
        setIsDbReady(true);
        await loadData();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        toast({
          title: 'Erro de Banco de Dados',
          description: 'Não foi possível carregar o banco de dados local.',
          variant: 'destructive',
        });
      }
    }
    initializeDB();

    window.addEventListener('datachanged', refreshData);

    return () => {
      window.removeEventListener('datachanged', refreshData);
    }
  }, [loadData, toast, isDbReady, refreshData]);

  const handleDelete = async (id: number) => {
    try {
      await db.deleteWarranty(id);
      toast({
        title: 'Sucesso',
        description: 'Garantia excluída com sucesso.',
      });
      refreshData();
    } catch (error) {
      console.error('Failed to delete warranty:', error);
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir a garantia.',
        variant: 'destructive',
      });
    }
  };

  const filteredWarranties = useMemo(() => {
    return warranties.filter(warranty => {
      // Show in Lote filter
      if (!showInLote && warranty.loteId) {
        return false;
      }

      // Client filter
      if (clientFilter && warranty.cliente !== clientFilter) {
        return false;
      }

      // Date filter
      const { from, to } = dateRange || {};
      if (from && warranty.dataRegistro) {
        if (parseISO(warranty.dataRegistro) < from) return false;
      }
      if (to && warranty.dataRegistro) {
        const toDate = addDays(to, 1);
        if (parseISO(warranty.dataRegistro) >= toDate) return false;
      }

      // Search term filter
      if (!smartSearch(warranty, searchTerm, [
        'codigo',
        'descricao',
        'fornecedor',
        'cliente',
        'defeito',
        'status',
        'requisicaoVenda',
        'requisicoesGarantia',
        'notaFiscalRetorno'
      ])) {
        return false;
      }
      return true;
    });
  }, [searchTerm, warranties, dateRange, clientFilter, showInLote]);

  const sortedWarranties = useMemo(() => {
    const sortableItems = [...filteredWarranties];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        let comparison = 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          if (sortConfig.key === 'dataRegistro') {
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
  }, [filteredWarranties, sortConfig]);

  const clientOptions = useMemo(() => persons
    .filter(p => p.tipo === 'Cliente' || p.tipo === 'Ambos')
    .map(c => ({ value: c.nome, label: c.nome })),
    [persons]
  );

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      dateRange: { from: new Date(new Date().setDate(new Date().getDate() - 30)), to: new Date() },
      clientFilter: '',
      showInLote: false,
      sortConfig: { key: 'id', direction: 'descending' }
    });
    setVisibleCount(50);
  }

  const handleAddToLote = async (loteId: number) => {
    try {
      const selectedWarranties = await db.getWarrantiesByIds(Array.from(selectedIds));

      for (const warranty of selectedWarranties) {
        warranty.loteId = loteId;
        await db.updateWarranty(warranty);
      }

      toast({
        title: 'Sucesso!',
        description: `${selectedIds.size} garantias foram adicionadas ao lote.`
      });
      refreshData();
    } catch (error) {
      console.error("Failed to add warranties to lote:", error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar as garantias ao lote.',
        variant: 'destructive'
      });
    } finally {
      setIsLoteDialogOpen(false);
    }
  }

  const handleGoToLotes = () => {
    setIsLoteDialogOpen(false);
    setActiveView('lotes');
  };

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const total = warranties.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let paid = 0;

    warranties.forEach(w => {
      const status = w.status || '';
      if (status === 'Aguardando Envio' || status === 'Enviado para Análise') pending++;
      if (status.startsWith('Aprovada')) approved++;
      if (status === 'Recusada') rejected++;
      if (status === 'Aprovada - Crédito Boleto' || status === 'Aprovada - Crédito NF') paid++;
    });

    return { total, pending, approved, rejected, paid };
  }, [warranties]);

  // --- Bulk Actions ---
  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      const selectedWarranties = await db.getWarrantiesByIds(Array.from(selectedIds));

      for (const warranty of selectedWarranties) {
        warranty.status = newStatus as any; // Cast to specific type if needed
        await db.updateWarranty(warranty);
      }

      toast({
        title: 'Status Atualizado em Massa',
        description: `${selectedIds.size} garantias marcadas como "${newStatus}".`
      });
      refreshData();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os status.',
        variant: 'destructive'
      });
    }
  };



  if (!isDbReady) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* --- Summary Cards --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrado</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Garantias no sistema</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <FilterX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando envio/análise</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <PlusCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Crédito ou peça nova</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recusadas</CardTitle>
            <FilterX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Garantias negadas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Consultar Garantias</CardTitle>
          <CardDescription>
            Painel de gerenciamento e consulta de garantias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <SearchInput
              placeholder="Buscar por código, descrição, cliente..."
              value={searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              onClear={() => setFilters({ ...filters, searchTerm: '' })}
              className="w-full"
              containerClassName="relative flex-1 max-w-full"
            />
            <div className='flex flex-col md:flex-row gap-4'>
              <Combobox
                options={clientOptions}
                value={clientFilter}
                onChange={(val) => setFilters({ ...filters, clientFilter: val })}
                placeholder="Filtrar por cliente..."
                searchPlaceholder='Buscar cliente...'
                notFoundMessage='Nenhum cliente encontrado.'
                className='w-full'
              />
              <DatePickerWithRange
                date={dateRange}
                setDate={(range) => setFilters({ ...filters, dateRange: range })}
              />
            </div>
          </div>

          {/* --- Filters & Actions Bar --- */}
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4 bg-muted/30 p-2 rounded-lg border">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showInLote"
                  checked={showInLote}
                  onCheckedChange={(checked) => setFilters({ ...filters, showInLote: Boolean(checked) })}
                />
                <Label htmlFor="showInLote" className="text-sm font-medium cursor-pointer">Mostrar itens em lotes</Label>
              </div>
              {selectedIds.size > 0 && (
                <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                  {selectedIds.size} selecionado(s)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                <FilterX className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>

              {/* --- Bulk Actions Dropdown --- */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={selectedIds.size === 0} variant="outline" className="border-dashed">
                    Ações em Massa <MoreHorizontal className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setIsLoteDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar ao Lote
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('Aguardando Envio')}>
                    <Hourglass className="mr-2 h-4 w-4 text-amber-500" /> Aguardando Envio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('Enviado para Análise')}>
                    <Send className="mr-2 h-4 w-4 text-blue-500" /> Enviado para Análise
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('Aprovada - Crédito Boleto')}>
                    <DollarSign className="mr-2 h-4 w-4 text-green-600" /> Aprovada (Crédito)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('Recusada')}>
                    <XCircle className="mr-2 h-4 w-4 text-red-500" /> Recusada
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-4">
            <WarrantyTable
              warranties={sortedWarranties.slice(0, visibleCount)}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onEdit={onEdit}
              onClone={onClone}
              onDelete={handleDelete}
              sortConfig={sortConfig}
              onSort={(config) => setFilters({ ...filters, sortConfig: config as any })}
            />

            {visibleCount < sortedWarranties.length && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount(prev => prev + 50)}
                  className="w-full max-w-xs"
                >
                  Carregar Mais (Exibindo {visibleCount} de {sortedWarranties.length})
                </Button>
              </div>
            )}

            {sortedWarranties.length > 0 && visibleCount >= sortedWarranties.length && (
              <p className="text-center text-xs text-muted-foreground pt-2">
                Todos os {sortedWarranties.length} registros foram carregados.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AddToLoteDialog
        isOpen={isLoteDialogOpen}
        onOpenChange={setIsLoteDialogOpen}
        lotes={openLotes}
        onConfirm={handleAddToLote}
        selectedCount={selectedIds.size}
        onGoToLotes={handleGoToLotes}
      />
    </div>
  );
}
