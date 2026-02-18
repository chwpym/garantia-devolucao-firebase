

'use client';

import { useState } from 'react';
import type { Warranty } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Copy, ArrowUpDown } from 'lucide-react';
import { StatusBadge } from './ui/status-badge';
import { Checkbox } from './ui/checkbox';

type SortableKeys = keyof Warranty;

interface WarrantyTableProps {
  warranties: Warranty[];
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  onEdit: (warranty: Warranty) => void;
  onClone: (warranty: Warranty) => void;
  onDelete: (id: number) => Promise<void>;
  sortConfig: { key: SortableKeys, direction: 'ascending' | 'descending' } | null;
  onSort: (config: { key: SortableKeys, direction: 'ascending' | 'descending' } | null) => void;
  emptyState?: React.ReactNode;
}

export default function WarrantyTable({ 
  warranties, 
  selectedIds, 
  onSelectionChange, 
  onEdit, 
  onClone, 
  onDelete, 
  sortConfig, 
  onSort,
  emptyState
}: WarrantyTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Warranty | null>(null);

  const handleDeleteClick = () => {
    if (deleteTarget?.id) {
      onDelete(deleteTarget.id);
    }
    setDeleteTarget(null);
  };


  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(warranties.map(w => w.id!)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleRowSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onSelectionChange(newSet);
  };

  const isAllSelected = warranties.length > 0 && selectedIds.size === warranties.length;

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    onSort({ key, direction });
  };

  const getSortIcon = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  const SortableHeader = ({ sortKey, children, className }: { sortKey: SortableKeys, children: React.ReactNode, className?: string }) => (
    <TableHead className={className}>
      <Button variant="ghost" onClick={() => requestSort(sortKey)} className="group px-2">
        {children}
        {getSortIcon(sortKey)}
      </Button>
    </TableHead>
  );

  return (
    <>
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
              <SortableHeader sortKey="dataRegistro">Data</SortableHeader>
              <SortableHeader sortKey="codigo">Código</SortableHeader>
              <SortableHeader sortKey="descricao">Descrição</SortableHeader>
              <SortableHeader sortKey="quantidade">Qtd.</SortableHeader>
              <SortableHeader sortKey="fornecedor">Fornecedor</SortableHeader>
              <SortableHeader sortKey="cliente">Cliente</SortableHeader>
              <SortableHeader sortKey="notaFiscalRetorno">NF Retorno</SortableHeader>
              <SortableHeader sortKey="status">Status</SortableHeader>
              <TableHead className="w-[50px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warranties.length > 0 ? (
              warranties.map(warranty => (
                <TableRow key={warranty.id} data-state={selectedIds.has(warranty.id!) ? 'selected' : ''}>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedIds.has(warranty.id!)}
                      onCheckedChange={() => handleRowSelect(warranty.id!)}
                      aria-label={`Selecionar garantia ${warranty.codigo}`}
                    />
                  </TableCell>
                  <TableCell>
                    {warranty.dataRegistro ? format(parseISO(warranty.dataRegistro), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell className="font-medium">{warranty.codigo || '-'}</TableCell>
                  <TableCell>{warranty.descricao || '-'}</TableCell>
                  <TableCell>{warranty.quantidade || '-'}</TableCell>
                  <TableCell>{warranty.fornecedor || '-'}</TableCell>
                  <TableCell>{warranty.cliente || '-'}</TableCell>
                  <TableCell>{warranty.notaFiscalRetorno || '-'}</TableCell>
                  <TableCell>
                    <StatusBadge type="warranty" status={warranty.status} />
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
                        <DropdownMenuItem onClick={() => onEdit(warranty)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onClone(warranty)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Clonar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTarget(warranty)} className="text-destructive focus:text-destructive">
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
                  {emptyState || (
                    <div className="text-center text-muted-foreground">
                      Nenhuma garantia encontrada para os filtros selecionados.
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a garantia com o código{' '}
              <span className="font-bold">{deleteTarget?.codigo}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClick} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
