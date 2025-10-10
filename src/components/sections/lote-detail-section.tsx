'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Lote, Warranty, Supplier, WarrantyStatus } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { ArrowLeft, Package, Calendar, Building, FileText, MoreHorizontal, Pencil, Trash2, CheckSquare, FileDown, Camera, Image as ImageIcon, Link as LinkIcon, Download, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';

import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import WarrantyForm from '../warranty-form';
import LoteForm from '../lote-form';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import ReportGenerator from '../report-generator';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"


interface LoteDetailSectionProps {
  loteId: number;
  onBack: () => void;
}

type SortableKeys = keyof Warranty;
const warrantyStatuses: WarrantyStatus[] = ['Em análise', 'Aprovada', 'Recusada', 'Paga'];

const LOTE_PDF_DEFAULT_FIELDS = [
  'codigo', 'descricao', 'quantidade', 'defeito'
];

const EditableObservationCell = ({ warranty, onSave }: { warranty: Warranty, onSave: (value: string) => void }) => {
    const [value, setValue] = useState(warranty.observacao || '');
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = () => {
        setIsEditing(false);
        if (value !== warranty.observacao) {
            onSave(value);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setValue(warranty.observacao || '');
        }
    }

    if (isEditing) {
        return (
            <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                autoFocus
                className="text-sm"
            />
        )
    }

    return (
        <div 
            onClick={() => setIsEditing(true)} 
            className="w-full h-full cursor-pointer min-h-[36px] p-2 rounded-md hover:bg-muted/50"
        >
            {value || <span className="text-muted-foreground">-</span>}
        </div>
    )
}

export default function LoteDetailSection({ loteId, onBack }: LoteDetailSectionProps) {
  const [lote, setLote] = useState<Lote | null>(null);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierData, setSupplierData] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isLoteFormModalOpen, setIsLoteFormModalOpen] = useState(false);
  const [warrantyToRemove, setWarrantyToRemove] = useState<Warranty | null>(null);
  const [selectedWarrantyIds, setSelectedWarrantyIds] = useState<Set<number>>(new Set());
  const [nfRetornoValue, setNfRetornoValue] = useState('');
  const [nfSaidaValue, setNfSaidaValue] = useState('');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: 'ascending' | 'descending' } | null>({ key: 'id', direction: 'descending' });
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

      if (currentLote) {
        const currentSupplier = allSuppliers.find(s => s.nomeFantasia === currentLote.fornecedor) || null;
        setSupplierData(currentSupplier);
      }

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

  const sortedWarranties = useMemo(() => {
    let sortableItems = [...warranties];
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
  }, [warranties, sortConfig]);

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
  
  const handleOpenGallery = (photos: string[]) => {
    setGalleryPhotos(photos);
    setIsGalleryOpen(true);
  }

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
  
  const handleFormSave = async (formData: Warranty) => {
     try {
      if (formData.id) {
        await db.updateWarranty(formData);
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
  
  const handleApplyNf = async (type: 'retorno' | 'saida') => {
    const nfValue = type === 'retorno' ? nfRetornoValue : nfSaidaValue;
    const fieldToUpdate = type === 'retorno' ? 'notaFiscalRetorno' : 'notaFiscalSaida';
    
    if (selectedWarrantyIds.size === 0 || !nfValue) {
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
            const updatedWarranty = { ...warranty, [fieldToUpdate]: nfValue };
            await db.updateWarranty(updatedWarranty);
        }
        toast({
            title: 'Sucesso!',
            description: `NF de ${type} ${nfValue} aplicada a ${selectedWarrantyIds.size} garantias.`,
        });

        if (type === 'retorno') {
            toast({
                title: "Lembrete",
                description: "Não se esqueça de alterar o status das garantias para 'Aprovada'.",
                duration: 5000,
            });
            setNfRetornoValue('');
        } else {
            setNfSaidaValue('');
        }
        
        setSelectedWarrantyIds(new Set());
        window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
        console.error(`Failed to apply NF de ${type} to selected warranties:`, error);
        toast({
            title: 'Erro',
            description: `Não foi possível aplicar a NF de ${type} às garantias selecionadas.`,
            variant: 'destructive'
        });
    }
  };
  
  const handleBulkStatusChange = async (status: WarrantyStatus) => {
    if (selectedWarrantyIds.size === 0) {
        toast({
            title: 'Nenhuma garantia selecionada',
            description: 'Selecione as garantias na tabela para alterar o status.',
            variant: 'destructive'
        });
        return;
    }

    try {
        const warrantiesToUpdate = warranties.filter(w => selectedWarrantyIds.has(w.id!));
        for (const warranty of warrantiesToUpdate) {
            const updatedWarranty = { ...warranty, status };
            await db.updateWarranty(updatedWarranty);
        }
        toast({
            title: 'Status Alterado em Massa!',
            description: `${selectedWarrantyIds.size} garantias foram atualizadas para "${status}".`
        });
        setSelectedWarrantyIds(new Set());
        window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
        console.error(`Failed to apply bulk status change:`, error);
        toast({
            title: 'Erro',
            description: 'Não foi possível alterar o status das garantias selecionadas.',
            variant: 'destructive'
        });
    }
};


  const handleStatusChange = async (warranty: Warranty, status: WarrantyStatus) => {
    try {
      const updatedWarranty = { ...warranty, status };
      await db.updateWarranty(updatedWarranty);
      toast({
        title: 'Status Alterado',
        description: `O status da garantia foi alterado para "${status}".`,
      });
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
      console.error('Failed to update warranty status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status da garantia.',
        variant: 'destructive',
      });
    }
  };
  
  const handleObservationSave = async (warranty: Warranty, observation: string) => {
    try {
        const updatedWarranty = { ...warranty, observacao: observation };
        await db.updateWarranty(updatedWarranty);
        toast({
            title: 'Observação Atualizada',
            description: 'A observação foi salva com sucesso.',
        });
        window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
        console.error('Failed to update observation:', error);
        toast({
            title: 'Erro',
            description: 'Não foi possível salvar a observação.',
            variant: 'destructive'
        });
    }
  }

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
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
            <div className='flex gap-2'>
                <Button onClick={handleEditLoteClick}><Pencil className="mr-2 h-4 w-4"/> Editar Informações do Lote</Button>
            </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Anexos</CardTitle>
                <CardDescription>Arquivos de autorização do fornecedor.</CardDescription>
            </CardHeader>
            <CardContent>
                {lote.attachments && lote.attachments.length > 0 ? (
                    <div className="space-y-2">
                        {lote.attachments.map((att, index) => (
                            <a
                                key={index}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between text-sm p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                            >
                                <div className='flex items-center gap-2'>
                                    <LinkIcon className='h-4 w-4' />
                                    <span className='truncate' title={att.name}>{att.name}</span>
                                </div>
                                <Download className="h-4 w-4" />
                            </a>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum anexo encontrado.</p>
                )}
            </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader className='flex flex-row justify-between items-center'>
            <div>
                <CardTitle>Itens no Lote</CardTitle>
                <CardDescription>Lista de todas as garantias incluídas neste lote. Use os checkboxes para atualizar em massa.</CardDescription>
            </div>
            <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <FileDown className="mr-2 h-4 w-4" />
                        Gerar Relatório do Lote
                    </Button>
                </DialogTrigger>
                <DialogContent className='max-w-3xl'>
                    <DialogHeader>
                        <DialogTitle>Gerar PDF para este Lote</DialogTitle>
                         <DialogDescription>
                            Selecione as opções de layout e os campos que deseja incluir no relatório para o fornecedor.
                        </DialogDescription>
                    </DialogHeader>
                    <div className='py-4'>
                        <ReportGenerator 
                            selectedWarranties={warranties}
                            title=""
                            description=""
                            supplierData={supplierData}
                            defaultFields={LOTE_PDF_DEFAULT_FIELDS}
                            loteId={lote.id}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div className='p-4 border rounded-lg space-y-2'>
                     <Label htmlFor="nf-saida">NF de Saída (Envio)</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            id="nf-saida"
                            placeholder="Nº da NF de Saída"
                            value={nfSaidaValue}
                            onChange={(e) => setNfSaidaValue(e.target.value)}
                        />
                        <Button onClick={() => handleApplyNf('saida')} disabled={selectedWarrantyIds.size === 0}>
                            Aplicar NF aos {selectedWarrantyIds.size > 0 ? `(${selectedWarrantyIds.size})` : ''} selecionados
                        </Button>
                    </div>
                </div>
                 <div className='p-4 border rounded-lg space-y-2'>
                    <Label htmlFor="nf-retorno">NF de Retorno (Recebimento)</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            id="nf-retorno"
                            placeholder="Nº da NF de Retorno"
                            value={nfRetornoValue}
                            onChange={(e) => setNfRetornoValue(e.target.value)}
                        />
                        <Button onClick={() => handleApplyNf('retorno')} disabled={selectedWarrantyIds.size === 0}>
                            Aplicar NF aos {selectedWarrantyIds.size > 0 ? `(${selectedWarrantyIds.size})` : ''} selecionados
                        </Button>
                    </div>
                 </div>
            </div>
            
            <div className="mb-4 flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={selectedWarrantyIds.size === 0}>
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Alterar Status em Massa {selectedWarrantyIds.size > 0 ? `(${selectedWarrantyIds.size})` : ''}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {warrantyStatuses.map(status => (
                            <DropdownMenuItem key={status} onSelect={() => handleBulkStatusChange(status)}>
                                Marcar como {status}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
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
                    <SortableHeader sortKey='id' className="w-16">Fotos</SortableHeader>
                    <SortableHeader sortKey='codigo'>Código</SortableHeader>
                    <SortableHeader sortKey='descricao'>Descrição</SortableHeader>
                    <SortableHeader sortKey='defeito'>Defeito</SortableHeader>
                    <SortableHeader sortKey='observacao' className="w-[300px]">Observação de Retorno</SortableHeader>
                    <SortableHeader sortKey='notaFiscalSaida'>NF Saída</SortableHeader>
                    <SortableHeader sortKey='notaFiscalRetorno'>NF Retorno</SortableHeader>
                    <SortableHeader sortKey='status'>Status</SortableHeader>
                    <TableHead className="w-[50px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedWarranties.length > 0 ? (
                    sortedWarranties.map(warranty => (
                      <TableRow key={warranty.id} data-state={selectedWarrantyIds.has(warranty.id!) ? "selected" : ""}>
                        <TableCell className="text-center">
                            <Checkbox
                                checked={selectedWarrantyIds.has(warranty.id!)}
                                onCheckedChange={() => handleRowSelect(warranty.id!)}
                                aria-label={`Selecionar garantia ${warranty.codigo}`}
                            />
                        </TableCell>
                        <TableCell>
                             {warranty.photos && warranty.photos.length > 0 ? (
                                <Button variant="ghost" size="icon" onClick={() => handleOpenGallery(warranty.photos!)}>
                                    <Camera className="h-5 w-5" />
                                </Button>
                            ) : (
                                <span className="flex justify-center text-muted-foreground">-</span>
                            )}
                        </TableCell>
                        <TableCell className="font-medium">{warranty.codigo || '-'}</TableCell>
                        <TableCell>{warranty.descricao || '-'}</TableCell>
                        <TableCell>{warranty.defeito || '-'}</TableCell>
                        <TableCell>
                            <EditableObservationCell 
                                warranty={warranty}
                                onSave={(value) => handleObservationSave(warranty, value)}
                            />
                        </TableCell>
                        <TableCell>{warranty.notaFiscalSaida || '-'}</TableCell>
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
                              <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <CheckSquare className="mr-2 h-4 w-4" />
                                        <span>Alterar Status</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                            {warrantyStatuses.map(status => (
                                                <DropdownMenuItem key={status} onClick={() => handleStatusChange(warranty, status)}>
                                                    <span>{status}</span>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
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
      
       {/* Photo Gallery Modal */}
        <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Galeria de Fotos</DialogTitle>
                    <DialogDescription>Fotos anexadas à garantia.</DialogDescription>
                </DialogHeader>
                 {galleryPhotos.length > 0 ? (
                    <Carousel className="w-full">
                        <CarouselContent>
                            {galleryPhotos.map((photo, index) => (
                                <CarouselItem key={index}>
                                    <div className="p-1">
                                        <Card>
                                            <CardContent className="flex aspect-video items-center justify-center p-0 overflow-hidden rounded-lg">
                                                <Image src={photo} alt={`Foto ${index + 1}`} width={800} height={600} style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                 ) : (
                    <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg text-muted-foreground">
                        <ImageIcon className="h-10 w-10 mb-2" />
                        <p>Nenhuma foto encontrada para esta garantia.</p>
                    </div>
                 )}
            </DialogContent>
        </Dialog>

    </div>
  );
}
