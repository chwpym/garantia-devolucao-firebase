'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import ReportGenerator from '@/components/report-generator';
import type { Warranty, WarrantyStatus } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Search } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ReportSection() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | 'Todos'>('Todos');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
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
    const lowercasedTerm = searchTerm.toLowerCase();
    
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
      if (!lowercasedTerm) {
        return true;
      }
      return (
        warranty.codigo?.toLowerCase().includes(lowercasedTerm) ||
        warranty.descricao?.toLowerCase().includes(lowercasedTerm) ||
        warranty.fornecedor?.toLowerCase().includes(lowercasedTerm) ||
        warranty.cliente?.toLowerCase().includes(lowercasedTerm) ||
        warranty.defeito?.toLowerCase().includes(lowercasedTerm) ||
        warranty.status?.toLowerCase().includes(lowercasedTerm) ||
        warranty.requisicaoVenda?.toLowerCase().includes(lowercasedTerm) ||
        warranty.requisicoesGarantia?.toLowerCase().includes(lowercasedTerm)
      );
    });
  }, [searchTerm, warranties, dateRange, statusFilter]);


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

  const getStatusVariant = (status: Warranty['status']) => {
    switch (status) {
      case 'Aprovada':
        return 'default';
      case 'Recusada':
        return 'destructive';
      case 'Paga':
        return 'outline';
      case 'Em análise':
      default:
        return 'secondary';
    }
  };

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
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Buscar por código, descrição, requisições, fornecedor, cliente, defeito ou status..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10"
                  />
              </div>
               <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as WarrantyStatus | 'Todos')}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Todos">Todos Status</SelectItem>
                        <SelectItem value="Em análise">Em análise</SelectItem>
                        <SelectItem value="Aprovada">Aprovada</SelectItem>
                        <SelectItem value="Recusada">Recusada</SelectItem>
                        <SelectItem value="Paga">Paga</SelectItem>
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
                {filteredWarranties.length > 0 ? (
                  filteredWarranties.map(warranty => (
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
                        {warranty.status ? (
                            <Badge variant={getStatusVariant(warranty.status)}>{warranty.status}</Badge>
                        ) : (
                            <Badge variant="secondary">N/A</Badge>
                        )}
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
        </CardContent>
      </Card>
      
      <ReportGenerator selectedWarranties={selectedWarranties} />
    </div>
  );
}
