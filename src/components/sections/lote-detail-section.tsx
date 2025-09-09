'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Lote, Warranty, Supplier } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { ArrowLeft, Package, Calendar, Building, FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import WarrantyForm from '../warranty-form';
import LoteForm from '../lote-form';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';

interface LoteDetailSectionProps {
  loteId: number;
  onBack: () => void;
}

export default function LoteDetailSection({ loteId, onBack }: LoteDetailSectionProps) {
  const [lote, setLote] = useState<Lote | null>(null);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isLoteFormModalOpen, setIsLoteFormModalOpen] = useState(false);
  const [warrantyToRemove, setWarrantyToRemove] = useState<Warranty | null>(null);
  const [selectedWarrantyIds, setSelectedWarrantyIds] = useState<Set<number>>(new Set());
  const [nfRetornoValue, setNfRetornoValue] = useState('');
  const { toast } = useToast();

  const loadLoteDetails = useCallback(async () => {
    if (!loteId) return;
    setIsLoading(true);
    try {
      await db.initDB();
      const [allLotes, allWarranties, allSuppliers] = await Promise.all([
        db.getAllLotes(),
        db.getAllWarranties(),
        db.getAllSuppliers()
      ]);
      const currentLote = allLotes.find((l) => l.id === loteId) || null;
      const associatedWarranties = allWarranties.filter((w) => w.loteId === loteId);
      
      setLote(currentLote);
      setWarranties(associatedWarranties);
      setSuppliers(allSuppliers);
    } catch (error) {
      console.error('Failed to load lote details:', error);
      toast({
        title: 'Erro ao carregar lote',
        description: 'Não foi possível encontrar os detalhes para este lote.',
        variant: 'destructive',
      });
      onBack();
    } finally {
      setIsLoading(false);
    }
  }, [loteId, toast, onBack]);

  useEffect(() => {
    loadLoteDetails();
     const handleDataChanged = () => {
      loadLoteDetails();
    };
    window.addEventListener('datachanged', handleDataChanged);
    return () => {
      window.removeEventListener('datachanged', handleDataChanged);
    };
  }, [loadLoteDetails]);

  const handleEditClick = (warranty: Warranty) => {
    setEditingWarranty(warranty);
    setIsFormModalOpen(true);
  };
  
  const handleEditLoteClick = () => {
    setIsLoteFormModalOpen(true);
  };

  const handleRemoveClick = (warranty: Warranty) => {
    setWarrantyToRemove(warranty);
  };

  const handleConfirmRemove = async () => {
    if (!warrantyToRemove) return;
    try {
      const updatedWarranty = { ...warrantyToRemove, loteId: null };
      await db.updateWarranty(updatedWarranty);
      toast({
        title: 'Garantia Removida',
        description: 'A garantia foi removida do lote com sucesso.',
      });
      setWarrantyToRemove(null);
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
      console.error('Failed to remove warranty from lote:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a garantia do lote.',
        variant: 'destructive',
      });
    }
  };
  
  const handleFormSave = async (data: Omit<Warranty, 'id'>, id?: number) => {
     try {
      if (id) {
        await db.updateWarranty({ ...data, id });
        toast({ title: 'Sucesso', description: 'Garantia atualizada com sucesso.' });
      }
      setIsFormModalOpen(false);
      setEditingWarranty(null);
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error)      {
      console.error('Failed to save warranty:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar a garantia.',
        variant: 'destructive',
      });
    }
  };
  
  const handleLoteFormSave = () => {
    setIsLoteFormModalOpen(false);
    loadLoteDetails();
  }


  const getStatusVariant = (status?: Lote['status']) => {
    switch (status) {
      case 'Aberto': return 'secondary';
      case 'Enviado': return 'default';
      case 'Aprovado Totalmente': return 'default';
      case 'Aprovado Parcialmente': return 'outline';
      case 'Recusado': return 'destructive';
      default: return 'secondary';
    }
  };

  const getWarrantyStatusVariant = (status?: Warranty['status']) => {
    switch (status) {
      case 'Aprovada': return 'default';
      case 'Recusada': return 'destructive';
      case 'Paga': return 'outline';
      case 'Em análise': default: return 'secondary';
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWarrantyIds(new Set(warranties.map(w => w.id!)));
    } else {
      setSelectedWarrantyIds(new Set());
    }
  };

  const handleRowSelect = (id: number) => {
    const newSet = new Set(selectedWarrantyIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedWarrantyIds(newSet);
  };
  
  const handleApplyNfToSelected = async () => {
    if (selectedWarrantyIds.size === 0 || !nfRetornoValue) {
        toast({
            title: 'Ação inválida',
            description: 'Selecione pelo menos uma garantia e insira o número da NF.',
            variant: 'destructive'
        });
        return;
    }

    try {
        const warrantiesToUpdate = warranties.filter(w => selectedWarrantyIds.has(w.id!));
        for (const warranty of warrantiesToUpdate) {
            const updatedWarranty = { ...warranty, notaFiscalRetorno: nfRetornoValue };
            await db.updateWarranty(updatedWarranty);
        }
        toast({
            title: 'Sucesso!',
            description: `NF ${nfRetornoValue} aplicada a ${selectedWarrantyIds.size} garantias.`
        });
        setNfRetornoValue('');
        setSelectedWarrantyIds(new Set());
        window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
        console.error('Failed to apply NF to selected warranties:', error);
        toast({
            title: 'Erro',
            description: 'Não foi possível aplicar a NF às garantias selecionadas.',
            variant: 'destructive'
        });
    }
  };

  const isAllSelected = warranties.length > 0 && selectedWarrantyIds.size === warranties.length;

  if (isLoading) {
    return (
        <div className='space-y-4'>
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-80 w-full" />
        </div>
    )
  }

  if (!lote) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold">Lote não encontrado</h2>
        <p className="text-muted-foreground mt-2">
          O lote que você está procurando não existe ou foi excluído.
        </p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a Lista de Lotes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <Button variant="ghost" onClick={onBack} className="mb-2 -ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a Lista de Lotes
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Detalhes do Lote: {lote.nome}</h1>
            </div>
            <Button onClick={handleEditLoteClick}><Pencil className="mr-2 h-4 w-4"/> Editar Lote</Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Informações do Lote</CardTitle>
        </CardHeader>
        <CardContent className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <div className="flex items-center gap-3">
                <Building className="h-8 w-8 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Fornecedor</p>
                    <p className="font-medium">{lote.fornecedor}</p>
                </div>
            </div>
             <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Data de Criação</p>
                    <p className="font-medium">{lote.dataCriacao ? format(parseISO(lote.dataCriacao), 'dd/MM/yyyy') : '-'}</p>
                </div>
            </div>
             <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">NF(s) de Retorno</p>
                    <p className="font-medium">{lote.notasFiscaisRetorno || 'Nenhuma'}</p>
                </div>
            </div>
             <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={getStatusVariant(lote.status)}>{lote.status}</Badge>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Itens no Lote</CardTitle>
            <CardDescription>Lista de todas as garantias incluídas neste lote. Use os checkboxes para atualizar a NF de retorno em massa.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <Input
                    placeholder="Nº da NF de Retorno"
                    value={nfRetornoValue}
                    onChange={(e) => setNfRetornoValue(e.target.value)}
                    className="max-w-xs"
                />
                <Button onClick={handleApplyNfToSelected} disabled={selectedWarrantyIds.size === 0}>
                    Aplicar NF aos {selectedWarrantyIds.size > 0 ? `(${selectedWarrantyIds.size})` : ''} selecionados
                </Button>
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
                    <TableHead>NF Retorno</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warranties.length > 0 ? (
                    warranties.map(warranty => (
                      <TableRow key={warranty.id} data-state={selectedWarrantyIds.has(warranty.id!) ? "selected" : ""}>
                        <TableCell className="text-center">
                            <Checkbox
                                checked={selectedWarrantyIds.has(warranty.id!)}
                                onCheckedChange={() => handleRowSelect(warranty.id!)}
                                aria-label={`Selecionar garantia ${warranty.codigo}`}
                            />
                        </TableCell>
                        <TableCell className="font-medium">{warranty.codigo || '-'}</TableCell>
                        <TableCell>{warranty.descricao || '-'}</TableCell>
                        <TableCell>{warranty.notaFiscalRetorno || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={getWarrantyStatusVariant(warranty.status)}>{warranty.status || 'N/A'}</Badge>
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
                              <DropdownMenuItem onClick={() => handleEditClick(warranty)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar Garantia
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRemoveClick(warranty)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover do Lote
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhuma garantia adicionada a este lote ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
      
      {/* Modal for editing warranty */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Editar Garantia</DialogTitle>
                <DialogDescription>
                    Faça as alterações necessárias na garantia abaixo.
                </DialogDescription>
            </DialogHeader>
            <div className='py-4 max-h-[70vh] overflow-y-auto'>
                 <WarrantyForm 
                    selectedWarranty={editingWarranty}
                    onSave={handleFormSave}
                    onClear={() => {
                        setIsFormModalOpen(false);
                        setEditingWarranty(null);
                    }}
                    isModal={true}
                 />
            </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal for editing lote */}
      <Dialog open={isLoteFormModalOpen} onOpenChange={setIsLoteFormModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Lote</DialogTitle>
                <DialogDescription>
                    Atualize as informações do lote, como o status ou as notas fiscais de retorno.
                </DialogDescription>
            </DialogHeader>
            <LoteForm
                onSave={handleLoteFormSave}
                editingLote={lote}
                suppliers={suppliers}
            />
        </DialogContent>
      </Dialog>
      
      {/* Alert dialog for removing warranty from lote */}
      <AlertDialog open={!!warrantyToRemove} onOpenChange={(open) => !open && setWarrantyToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Garantia do Lote?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja remover a garantia (Código: <span className="font-bold">{warrantyToRemove?.codigo || 'N/A'}</span>) deste lote? 
              A garantia não será excluída, apenas desvinculada, e voltará para a tela de Consulta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove}>
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
