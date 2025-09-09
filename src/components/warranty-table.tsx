'use client';

import { useState } from 'react';
import type { Warranty } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WarrantyTableProps {
  warranties: Warranty[];
  onEdit: (warranty: Warranty) => void;
  onDelete: (id: number) => Promise<void>;
}

export default function WarrantyTable({ warranties, onEdit, onDelete }: WarrantyTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Warranty | null>(null);

  const handleDeleteClick = () => {
    if (deleteTarget?.id) {
      onDelete(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

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
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>NF Retorno</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warranties.length > 0 ? (
              warranties.map(warranty => (
                <TableRow key={warranty.id}>
                  <TableCell>
                    {warranty.dataRegistro ? format(parseISO(warranty.dataRegistro), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell className="font-medium">{warranty.codigo || '-'}</TableCell>
                  <TableCell>{warranty.descricao || '-'}</TableCell>
                  <TableCell>{warranty.fornecedor || '-'}</TableCell>
                  <TableCell>{warranty.cliente || '-'}</TableCell>
                  <TableCell>{warranty.notaFiscalRetorno || '-'}</TableCell>
                  <TableCell>
                    {warranty.status ? (
                        <Badge variant={getStatusVariant(warranty.status)}>{warranty.status}</Badge>
                    ) : (
                        <Badge variant="secondary">N/A</Badge>
                    )}
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
                <TableCell colSpan={8} className="h-24 text-center">
                  Nenhuma garantia encontrada para os filtros selecionados.
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
