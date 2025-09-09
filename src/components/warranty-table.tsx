'use client';

import { useState } from 'react';
import type { Warranty } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface WarrantyTableProps {
  warranties: Warranty[];
  onEdit: (warranty: Warranty) => void;
  onDelete: (id: number) => Promise<void>;
  onRowSelect: (id: number) => void;
  onSelectAll: (checked: boolean) => void;
  selectedIds: Set<number>;
}

export default function WarrantyTable({ warranties, onEdit, onDelete, onRowSelect, onSelectAll, selectedIds }: WarrantyTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Warranty | null>(null);

  const handleDeleteClick = () => {
    if (deleteTarget?.id) {
      onDelete(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const isAllSelected = warranties.length > 0 && selectedIds.size === warranties.length;

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Garantias Registradas</CardTitle>
          <CardDescription>Visualize, edite e exclua as garantias cadastradas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => onSelectAll(Boolean(checked))}
                        aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Qtd.</TableHead>
                  <TableHead>Defeito</TableHead>
                  <TableHead>Cliente</TableHead>
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
                            onCheckedChange={() => onRowSelect(warranty.id!)}
                            aria-label={`Selecionar garantia ${warranty.codigo}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{warranty.codigo || '-'}</TableCell>
                      <TableCell>{warranty.descricao || '-'}</TableCell>
                      <TableCell className="text-center">{warranty.quantidade}</TableCell>
                      <TableCell>{warranty.defeito || '-'}</TableCell>
                      <TableCell>{warranty.cliente || '-'}</TableCell>
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
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhuma garantia registrada.
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
