
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Warranty, Lote, Person, CustomStatus } from '@/lib/types';
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
import { EmptyState } from '../ui/empty-state';
import { SearchX, LayoutList } from 'lucide-react';


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
  const [customStatuses, setCustomStatuses] = useState<CustomStatus[]>([]);
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
      const [allWarranties, allLotes, allPersons, allStatuses] = await Promise.all([
        db.getAllWarranties(),
        db.getAllLotes(),
        db.getAllPersons(),
        db.getAllStatuses()
      ]);
      setWarranties(allWarranties);
      setOpenLotes(allLotes.filter(l => l.status === 'Aberto'));
      setPersons(allPersons);
      setCustomStatuses(allStatuses);
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
  }, [loadData]);

  // Use this function to notify application that data changed globally.
  // The global listener will then trigger refreshData automatically.
  const notifyDataChanged = () => {
    window.dispatchEvent(new CustomEvent('datachanged'));
  };


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
      notifyDataChanged();
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
    .filter(p => !p.tipo || p.tipo.toLowerCase() === 'cliente' || p.tipo.toLowerCase() === 'ambos')
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
      notifyDataChanged();
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
      notifyDataChanged();
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
    <div className="flex flex-col h-full space-y-4">
      {/* Cabeçalho Híbrido: Título + Painéis */}
      <div className="flex flex-col md:flex-row gap-6 md:items-center">
        {/* Título */}
        <div className="flex-none flex flex-col gap-1 w-full md:w-auto">
          <h2 className="text-2xl font-bold tracking-tight">Consultar Garantias</h2>
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Gerenciamento e consultas.
          </p>
        </div>

        {/* Resumo (Cards Superiores) */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Card className="shadow-sm border-l-4 border-l-primary py-1 px-2">
            <div className="flex items-center justify-between opacity-70">
              <span className="text-[10px] font-bold uppercase tracking-wider">Registrado</span>
              <Search className="h-3 w-3" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black leading-none">{stats.total}</span>
            </div>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-amber-500 py-1 px-2">
            <div className="flex items-center justify-between opacity-70">
              <span className="text-[10px] font-bold uppercase tracking-wider">Pendentes</span>
              <FilterX className="h-3 w-3" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black leading-none">{stats.pending}</span>
            </div>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-green-600 py-1 px-2">
            <div className="flex items-center justify-between opacity-70">
              <span className="text-[10px] font-bold uppercase tracking-wider">Aprovadas</span>
              <PlusCircle className="h-3 w-3" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black leading-none">{stats.approved}</span>
            </div>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-destructive py-1 px-2">
            <div className="flex items-center justify-between opacity-70">
              <span className="text-[10px] font-bold uppercase tracking-wider">Recusadas</span>
              <FilterX className="h-3 w-3" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black leading-none">{stats.rejected}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* 2. Área de Busca e Filtros - Fixo */}
      <div className="flex-none space-y-4">

        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex flex-col md:flex-row gap-2 flex-grow">
            <SearchInput
              placeholder="Buscar por código, descrição..."
              value={searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              onClear={() => setFilters({ ...filters, searchTerm: '' })}
              className="flex-1"
            />
            <Combobox
              options={clientOptions}
              value={clientFilter}
              onChange={(val) => setFilters({ ...filters, clientFilter: val })}
              placeholder="Filtrar por Cliente..."
              className="w-full md:w-[280px] lg:w-[350px]"
            />
            <DatePickerWithRange
              date={dateRange}
              setDate={(range) => setFilters({ ...filters, dateRange: range })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-muted/30 p-2 rounded-lg border whitespace-nowrap flex-none">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showInLote"
                  checked={showInLote}
                  onCheckedChange={(checked) => setFilters({ ...filters, showInLote: Boolean(checked) })}
                />
                <Label htmlFor="showInLote" className="text-sm font-medium cursor-pointer">Itens em lotes</Label>
              </div>
              {selectedIds.size > 0 && (
                <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                  {selectedIds.size} selecionado(s)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <FilterX className="mr-2 h-4 w-4" />
                Limpar
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={selectedIds.size === 0} variant="outline" size="sm">
                    Ações <MoreHorizontal className="ml-2 h-4 w-4" />
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
        </div>
      </div>

      {/* 3. Tabela - Único ponto de Scroll Controlado */}
      <div className="flex-1 min-h-0 overflow-auto rounded-md border bg-card">
        <WarrantyTable
          warranties={sortedWarranties.slice(0, visibleCount)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEdit={onEdit}
          onClone={onClone}
          onDelete={handleDelete}
          sortConfig={sortConfig}
          onSort={(config) => setFilters({ ...filters, sortConfig: config as any })}
          emptyState={
            searchTerm || clientFilter || dateRange?.from || dateRange?.to ? (
              <EmptyState 
                icon={SearchX}
                title="Nada encontrado"
                description="Ajuste os filtros de busca."
              />
            ) : (
              <EmptyState 
                icon={LayoutList}
                title="Nenhum registro"
                description="Inicie uma busca para ver as garantias."
              />
            )
          }
        />

        {visibleCount < sortedWarranties.length && (
          <div className="flex justify-center p-4">
            <Button
              variant="outline"
              onClick={() => setVisibleCount(prev => prev + 50)}
            >
              Carregar Mais ({visibleCount}/{sortedWarranties.length})
            </Button>
          </div>
        )}
      </div>

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
