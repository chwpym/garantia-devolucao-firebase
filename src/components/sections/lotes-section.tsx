'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Lote, Supplier } from '@/lib/types';
import * as db from '@/lib/db';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Package, Calendar, Building, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LoteForm from '../lote-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';


interface LotesSectionProps {
    onNavigateToLote: (loteId: number) => void;
    isNewLoteModalOpen?: boolean;
    setIsNewLoteModalOpen?: (isOpen: boolean) => void;
}

interface LoteWithItemCount extends Lote {
    itemCount: number;
}


export default function LotesSection({ onNavigateToLote, isNewLoteModalOpen = false, setIsNewLoteModalOpen }: LotesSectionProps) {
  const [lotes, setLotes] = useState<LoteWithItemCount[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLote, setEditingLote] = useState<Lote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lote | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      await db.initDB();
      const [allLotes, allSuppliers, allWarranties] = await Promise.all([
        db.getAllLotes(),
        db.getAllSuppliers(),
        db.getAllWarranties()
      ]);

      const lotesWithCounts = allLotes.map(lote => {
          const itemCount = allWarranties.filter(w => w.loteId === lote.id).length;
          return { ...lote, itemCount };
      })

      setLotes(lotesWithCounts.sort((a, b) => parseISO(b.dataCriacao).getTime() - parseISO(a.dataCriacao).getTime()));
      setSuppliers(allSuppliers);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Erro ao Carregar Dados',
        description: 'Não foi possível carregar os lotes e fornecedores.',
        variant: 'destructive',
      });
    }
  }, [toast]);
  
  useEffect(() => {
    if(isNewLoteModalOpen && setIsNewLoteModalOpen) {
      handleOpenModal();
      setIsNewLoteModalOpen(false);
    }
  }, [isNewLoteModalOpen, setIsNewLoteModalOpen]);

  useEffect(() => {
    loadData();
    window.addEventListener('datachanged', loadData);
    return () => {
        window.removeEventListener('datachanged', loadData);
    };
  }, [loadData]);
  
  const handleSave = () => {
    setIsModalOpen(false);
    setEditingLote(null);
  };
  
  const handleEdit = (lote: Lote) => {
    setEditingLote(lote);
    setIsModalOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.id) return;
    try {
      await db.deleteLote(deleteTarget.id);
      toast({ title: 'Sucesso', description: 'Lote excluído com sucesso.' });
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
      console.error('Failed to delete lote:', error);
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir o lote.',
        variant: 'destructive',
      });
    } finally {
        setDeleteTarget(null);
    }
  };
  
  const handleOpenModal = () => {
    setEditingLote(null);
    setIsModalOpen(true);
  };

  const getStatusVariant = (status: Lote['status']) => {
    switch (status) {
      case 'Aberto': return 'secondary';
      case 'Enviado': return 'default';
      case 'Aprovado Totalmente': return 'default';
      case 'Aprovado Parcialmente': return 'outline';
      case 'Recusado': return 'destructive';
      default: return 'secondary';
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lotes de Garantia</h1>
          <p className="text-lg text-muted-foreground">
            Agrupe, envie e gerencie suas garantias para fornecedores.
          </p>
        </div>
      </div>
      
      {lotes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lotes.map((lote) => (
            <Card 
                key={lote.id} 
                className="flex flex-col shadow-md hover:border-primary transition-colors cursor-pointer"
                onClick={() => onNavigateToLote(lote.id!)}
            >
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                   <CardTitle className="text-xl">
                        <span className="text-muted-foreground font-normal">Lote #{lote.id}</span>
                        <br />
                        {lote.nome}
                   </CardTitle>
                   <CardDescription className="flex items-center gap-2 pt-2">
                        <Building className="h-4 w-4" /> 
                        {lote.fornecedor}
                   </CardDescription>
                </div>
                <DropdownMenu onOpenChange={(open) => { if (open) { event?.stopPropagation(); } }}>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleEdit(lote);}}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {e.stopPropagation(); setDeleteTarget(lote);}} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>{lote.itemCount} Itens no lote</span>
                  </div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Criado em: {lote.dataCriacao ? format(parseISO(lote.dataCriacao), 'dd/MM/yyyy') : '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                     <FileText className="h-4 w-4" />
                     <span>NF de Retorno: {lote.notasFiscaisRetorno || 'N/D'}</span>
                  </div>

              </CardContent>
              <CardFooter>
                 <Badge variant={getStatusVariant(lote.status)}>{lote.status}</Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
         <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Nenhum lote de garantia encontrado</h2>
            <p className="text-muted-foreground mt-2">
              Clique em &quot;Novo Lote&quot; no menu superior para começar a agrupar suas garantias.
            </p>
         </div>
      )}
      
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingLote ? 'Editar Lote' : 'Criar Novo Lote de Garantia'}</DialogTitle>
                    <DialogDescription>
                        Dê um nome ao lote e selecione o fornecedor para agrupar as garantias.
                    </DialogDescription>
                </DialogHeader>
                <LoteForm
                    onSave={handleSave}
                    editingLote={editingLote}
                    suppliers={suppliers}
                />
            </DialogContent>
        </Dialog>


      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o lote <span className="font-bold">{deleteTarget?.nome}</span> e desvinculará suas garantias.
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
