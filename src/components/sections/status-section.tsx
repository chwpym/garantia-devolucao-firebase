
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CustomStatus, StatusApplicability } from '@/lib/types';
import * as db from '@/lib/db';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, PlusCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import StatusForm from '../status-form';

const applicabilityLabels: Record<StatusApplicability, string> = {
  garantia: 'Garantias',
  lote: 'Lotes',
  devolucao: 'Devoluções',
};

export default function StatusSection() {
  const [statuses, setStatuses] = useState<CustomStatus[]>([]);
  const [editingStatus, setEditingStatus] = useState<CustomStatus | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomStatus | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const { toast } = useToast();

  const loadStatuses = useCallback(async () => {
    try {
      const allStatuses = await db.getAllStatuses();
      setStatuses(allStatuses);
    } catch (error) {
      console.error('Failed to load statuses:', error);
      toast({
        title: 'Erro ao Carregar',
        description: 'Não foi possível carregar os status cadastrados.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    loadStatuses();
    window.addEventListener('datachanged', loadStatuses);
    return () => {
      window.removeEventListener('datachanged', loadStatuses);
    };
  }, [loadStatuses]);

  const handleSave = () => {
    setEditingStatus(null);
    setIsFormModalOpen(false);
    window.dispatchEvent(new CustomEvent('datachanged'));
  };

  const handleEditClick = (status: CustomStatus) => {
    setEditingStatus(status);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = () => {
    if (!deleteTarget?.id) return;
    db.deleteStatus(deleteTarget.id)
      .then(() => {
        toast({ title: 'Sucesso', description: 'Status excluído com sucesso.' });
        window.dispatchEvent(new CustomEvent('datachanged'));
      })
      .catch(() => {
        toast({
          title: 'Erro ao Excluir',
          description: 'Não foi possível excluir o status.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setDeleteTarget(null);
      });
  };

  return (
    <div className='space-y-8'>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Status</h1>
          <p className="text-lg text-muted-foreground">
            Crie, edite e gerencie os status utilizados nos módulos do sistema.
          </p>
        </div>
        <Dialog
          open={isFormModalOpen}
          onOpenChange={(isOpen) => {
            setIsFormModalOpen(isOpen);
            if (!isOpen) setEditingStatus(null);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingStatus ? 'Editar Status' : 'Novo Status'}</DialogTitle>
              <DialogDescription>
                Defina o nome, a cor e onde este status será aplicado.
              </DialogDescription>
            </DialogHeader>
            <StatusForm onSave={handleSave} editingStatus={editingStatus} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Status Cadastrados</CardTitle>
          <CardDescription>Lista de todos os status personalizados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Aplicável Em</TableHead>
                  <TableHead className="w-[50px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.length > 0 ? (
                  statuses.map((status) => (
                    <TableRow key={status.id}>
                      <TableCell>
                        <Badge style={{ backgroundColor: status.cor, color: 'white' }}>
                          {status.nome}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{status.nome}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {status.aplicavelEm.map((app) => (
                            <Badge key={app} variant="secondary">
                              {applicabilityLabels[app]}
                            </Badge>
                          ))}
                        </div>
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
                            <DropdownMenuItem onClick={() => handleEditClick(status)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(status)}
                              className="text-destructive focus:text-destructive"
                            >
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
                    <TableCell colSpan={4} className="h-24 text-center">
                      Nenhum status personalizado cadastrado.
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
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o status{' '}
              <span className="font-bold">{deleteTarget?.nome}</span>.
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
    </div>
  );
}
