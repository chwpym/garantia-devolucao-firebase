
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import ReportGenerator from '@/components/report-generator';
import type { Warranty, WarrantyStatus } from '@/lib/types';
import { WARRANTY_STATUSES } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { addDays, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { smartSearch } from '@/lib/search-utils';
import { SearchInput } from '@/components/ui/search-input';
import { StatusBadge } from '@/components/ui/status-badge';

export default function ReportSection() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | 'Todos'>('Todos');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [visibleCount, setVisibleCount] = useState(50);
  const { toast } = useToast();

  const loadWarranties = useCallback(async () => {
    try {
      await db.initDB();
      const allWarranties = await db.getAllWarranties();
      setWarranties(allWarranties.sort((a, b) => (b.id ?? 0) - (a.id ?? 0)));
    } catch (error) {
      console.error('Failed to load warranties:', error);
      toast({
        title: 'Erro ao Carregar',
        description: 'Não foi possível carregar as garantias.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    loadWarranties();
  }, [loadWarranties]);

  const filteredWarranties = useMemo(() => {
    return warranties.filter(warranty => {
      // Status filter
      if (statusFilter !== 'Todos' && warranty.status !== statusFilter) {
        return false;
      }

      // Date filter
      const { from, to } = dateRange || {};
      if (from && warranty.dataRegistro) {
        if (parseISO(warranty.dataRegistro) < from) return false;
      }
      if (to && warranty.dataRegistro) {
        // To include the selected end date, we compare with the start of the next day
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
        'requisicoesGarantia'
      ])) {
        return false;
      }

      return true;
    });
  }, [searchTerm, warranties, dateRange, statusFilter]);

  const visibleWarranties = useMemo(() => {
    return filteredWarranties.slice(0, visibleCount);
  }, [filteredWarranties, visibleCount]);

  useEffect(() => {
    setVisibleCount(50);
  }, [searchTerm, statusFilter, dateRange]);


  const handleSelectionChange = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredWarranties.map(w => w.id!)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const isAllSelected = filteredWarranties.length > 0 && selectedIds.size === filteredWarranties.length;

  const selectedWarranties = useMemo(() => {
    return warranties.filter(w => w.id && selectedIds.has(w.id));
  }, [warranties, selectedIds]);


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Seleção de Garantias para Relatório</CardTitle>
          <CardDescription>
            Filtre e marque as garantias que você deseja incluir no relatório em PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <SearchInput
              placeholder="Buscar por código, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              className="w-full"
              containerClassName="flex-1 max-w-full"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as WarrantyStatus | 'Todos')}>
              <SelectTrigger className="w-full md:w-[280px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos Status</SelectItem>
                {WARRANTY_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleWarranties.length > 0 ? (
                  visibleWarranties.map(warranty => (
                    <TableRow key={warranty.id} data-state={selectedIds.has(warranty.id!) ? 'selected' : ''}>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedIds.has(warranty.id!)}
                          onCheckedChange={() => handleSelectionChange(warranty.id!)}
                          aria-label={`Selecionar garantia ${warranty.codigo}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{warranty.codigo || '-'}</TableCell>
                      <TableCell>{warranty.descricao || '-'}</TableCell>
                      <TableCell>{warranty.fornecedor || '-'}</TableCell>
                      <TableCell>{warranty.cliente || '-'}</TableCell>
                      <TableCell>
                        <StatusBadge type="warranty" status={warranty.status} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhuma garantia encontrada para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {filteredWarranties.length > visibleCount && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setVisibleCount(prev => prev + 50)}
                className="w-full md:w-auto"
              >
                Carregar Mais ({filteredWarranties.length - visibleCount} restantes)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ReportGenerator selectedWarranties={selectedWarranties} />
    </div>
  );
}
