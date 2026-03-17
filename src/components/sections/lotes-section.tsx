
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Lote, Supplier } from '@/lib/types';
import * as db from '@/lib/db';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Package, Calendar, Building, FileText, CheckCircle, ShieldX, Hourglass, DollarSign, Search, ArrowRight, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import LoteForm from '../lote-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { StatusBadge } from '../ui/status-badge';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { smartSearch } from '@/lib/search-utils';
import { SearchInput } from '@/components/ui/search-input';
import { usePersistedFilters } from '@/hooks/use-persisted-filters';


interface LotesSectionProps {
  onNavigateToLote: (loteId: number) => void;
}

interface LoteWithStats extends Lote {
  itemCount: number;
  statusCounts: {
    aprovados: number;
    recusados: number;
    pendentes: number;
    pagos: number;
  };
}


export default function LotesSection({ onNavigateToLote }: LotesSectionProps) {
  const [lotes, setLotes] = useState<LoteWithStats[]>([]);
  const initialFilters = useMemo(() => ({
    searchTerm: '',
    sortConfig: { key: 'dataCriacao' as keyof Lote, direction: 'descending' as 'ascending' | 'descending' }
  }), []);

  const { filters, setFilters } = usePersistedFilters('lotes-list', initialFilters);
  const { searchTerm, sortConfig } = filters;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingLote, setEditingLote] = useState<Lote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lote | null>(null);
  const { toast } = useToast();

  const isNewLoteModalOpen = useAppStore(state => state.isNewLoteModalOpen);
  const setNewLoteModalOpen = useAppStore(state => state.setNewLoteModalOpen);

  const handleOpenModal = useCallback(() => {
    setEditingLote(null);
    setNewLoteModalOpen(true);
  }, [setNewLoteModalOpen]);

  const [statuses, setStatuses] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      await db.initDB();
      const [allLotes, allSuppliers, allWarranties, allStatuses] = await Promise.all([
        db.getAllLotes(),
        db.getAllSuppliers(),
        db.getAllWarranties(),
        db.getAllStatuses()
      ]);

      const lotesWithCounts: LoteWithStats[] = allLotes.map(lote => {
        const loteWarranties = allWarranties.filter(w => Number(w.loteId) === Number(lote.id));
        const itemCount = loteWarranties.length;

        const statusCounts = {
          aprovados: loteWarranties.filter(w => w.status?.startsWith('Aprovada')).length,
          recusados: loteWarranties.filter(w => w.status === 'Recusada').length,
          pagos: loteWarranties.filter(w => w.status === 'Aprovada - Crédito Boleto').length,
          pendentes: loteWarranties.filter(w => w.status === 'Aguardando Envio' || w.status === 'Enviado para Análise').length,
        };

        return { ...lote, itemCount, statusCounts };
      });

      setLotes(lotesWithCounts.sort((a, b) => parseISO(b.dataCriacao).getTime() - parseISO(a.dataCriacao).getTime()));
      setSuppliers(allSuppliers);
      setStatuses(allStatuses);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Erro ao Carregar Dados',
        description: 'Não foi possível carregar os lotes e fornecedores.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // useEffect for new lote removed to prevent destructive edits

  useEffect(() => {
    loadData();
    window.addEventListener('datachanged', loadData);
    return () => {
      window.removeEventListener('datachanged', loadData);
    };
  }, [loadData]);

  const handleSave = () => {
    setNewLoteModalOpen(false);
    setEditingLote(null);
  };

  const handleEdit = (lote: Lote) => {
    setEditingLote(lote);
    setNewLoteModalOpen(true);
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





  const filteredLotes = lotes.filter(lote =>
    smartSearch(lote, searchTerm, ['nome', 'fornecedor', 'notasFiscaisRetorno', 'id'])
  );
  const updateLoteStatus = async (lote: Lote, newStatus: string) => {
    try {
      const updatedLote = { ...lote, status: newStatus };
      await db.updateLote(updatedLote as any);
      toast({ title: 'Sucesso', description: `Lote movido para ${newStatus}` });
      window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível mover o lote.', variant: 'destructive' });
    }
  };

  const renderLoteCard = (lote: LoteWithStats) => {
    const customStatus = statuses.find(s => s.nome.toLowerCase() === lote.status?.toLowerCase() && s.aplicavelEm.includes('lote'));
    const customColor = customStatus?.cor;
    
    // Status Flow Helpers:
    const canMoveBack = lote.status === 'Aguardando Envio' || lote.status === 'Enviado';
    const canMoveForward = lote.status === 'Aberto' || lote.status === 'Aguardando Envio' || lote.status === 'Enviado';
    
    const getNextStatus = () => {
      if (lote.status === 'Aberto') return 'Aguardando Envio';
      if (lote.status === 'Aguardando Envio') return 'Enviado';
      if (lote.status === 'Enviado') return 'Concluído';
      return null;
    };
    
    const getPrevStatus = () => {
      if (lote.status === 'Aguardando Envio') return 'Aberto';
      if (lote.status === 'Enviado') return 'Aguardando Envio';
      if (lote.status === 'Concluído' || lote.status?.startsWith('Aprovado') || lote.status === 'Recusado') return 'Enviado';
      return null;
    };

    return (
      <Card
        key={lote.id}
        className={cn(
          "flex flex-col shadow-md hover:border-primary transition-all cursor-pointer border-2 bg-card/50 backdrop-blur-sm",
          !customColor && (
            lote.status === 'Enviado' ? 'border-accent-blue' :
            lote.status === 'Recusado' ? 'border-destructive' :
            lote.status === 'Aprovado Totalmente' || lote.status === 'Aprovado Parcialmente' ? 'border-accent-green' :
            lote.status === 'Aberto' ? 'border-amber-500/50' : 'border-transparent'
          )
        )}
        style={{ borderColor: customColor || undefined }}
        onClick={() => onNavigateToLote(lote.id!)}
      >
        <CardHeader className="flex flex-row items-start justify-between pb-2">
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
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(lote); }}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteTarget(lote); }} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="flex-grow space-y-4 pb-2">
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
            <span className="truncate max-w-[180px]">NF: {lote.notasFiscaisRetorno || 'N/D'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
            <div className='flex items-center gap-1.5'><CheckCircle className='h-3 w-3 text-green-500' /> Aprovados: <span className='font-bold'>{lote.statusCounts.aprovados}</span></div>
            <div className='flex items-center gap-1.5'><ShieldX className='h-3 w-3 text-red-500' /> Recusados: <span className='font-bold'>{lote.statusCounts.recusados}</span></div>
            <div className='flex items-center gap-1.5'><DollarSign className='h-3 w-3 text-blue-500' /> Pagos: <span className='font-bold'>{lote.statusCounts.pagos}</span></div>
            <div className='flex items-center gap-1.5'><Hourglass className='h-3 w-3 text-amber-500' /> Pendentes: <span className='font-bold'>{lote.statusCounts.pendentes}</span></div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-2 border-t mt-auto gap-2">
          <div className="flex gap-1">
            {canMoveBack && getPrevStatus() && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); updateLoteStatus(lote, getPrevStatus()!); }}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                title={`Voltar para ${getPrevStatus()}`}
              >
                <ArrowLeft className="h-3 w-3 mr-1" /> Voltar
              </Button>
            )}
          </div>
          
          <StatusBadge type="lote" status={lote.status} />
          
          <div className="flex gap-1">
            {canMoveForward && getNextStatus() && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); updateLoteStatus(lote, getNextStatus()!); }}
                className="h-7 px-2 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10"
                title={`Mover para ${getNextStatus()}`}
              >
                Mover <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
            {lote.status === 'Enviado' && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); updateLoteStatus(lote, 'Concluído'); }}
                className="h-7 px-2 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white"
              >
                Finalizar <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
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

      {/* --- Summary Cards --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Lotes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lotes.length}</div>
            <p className="text-xs text-muted-foreground">Cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abertos</CardTitle>
            <Hourglass className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lotes.filter(l => l.status === 'Aberto').length}</div>
            <p className="text-xs text-muted-foreground">Em montagem</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lotes.filter(l => l.status === 'Enviado').length}</div>
            <p className="text-xs text-muted-foreground">Aguardando retorno</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lotes.filter(l => ['Aprovado Totalmente', 'Aprovado Parcialmente', 'Recusado'].includes(l.status)).length}</div>
            <p className="text-xs text-muted-foreground">Processados</p>
          </CardContent>
        </Card>
      </div>

      {/* --- Filters --- */}
      <div className="flex items-center gap-4">
        <SearchInput
          placeholder="Buscar lotes..."
          value={searchTerm}
          onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
          onClear={() => setFilters({ ...filters, searchTerm: '' })}
        />
      </div>

      {filteredLotes.length > 0 ? (
        (() => {
          const columns = [
            { title: 'Aberto / Montagem', statuses: ['Aberto'], color: 'border-amber-500/30' },
            { title: 'Aguardando Envio', statuses: ['Aguardando Envio'], color: 'border-blue-500/30' },
            { title: 'Em Análise / Enviado', statuses: ['Enviado'], color: 'border-cyan-500/30' },
            { title: 'Finalizado', statuses: ['Concluído', 'Aprovado Totalmente', 'Aprovado Parcialmente', 'Recusado'], color: 'border-green-500/30' }
          ];

          return (
            <>
              {/* --- Desktop (Columns) --- */}
              <div className="hidden md:grid grid-cols-4 gap-4 p-1">
                {columns.map(col => {
                  const columnLotes = filteredLotes.filter(l => col.statuses.includes(l.status!));
                  return (
                    <div key={col.title} className={cn("flex flex-col space-y-3 bg-muted/20 p-3 rounded-xl border border-dashed min-h-[500px]", col.color)}>
                      <div className="flex items-center justify-between pb-2 border-b border-dashed border-muted-foreground/20">
                        <h3 className="font-bold text-xs tracking-wide uppercase text-muted-foreground">{col.title}</h3>
                        <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0">
                          {columnLotes.length}
                        </Badge>
                      </div>
                      <div className="flex flex-col space-y-3 overflow-y-auto max-h-[70vh] pr-1 styled-scrollbar flex-grow">
                        {columnLotes.length > 0 ? (
                          columnLotes.map(renderLoteCard)
                        ) : (
                          <div className="text-center text-xs text-muted-foreground/60 py-8 border border-dashed rounded-lg bg-background/30 mt-4">
                            Vazio
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* --- Mobile (Tabs) --- */}
              <div className="md:hidden">
                <Tabs defaultValue={columns[0].title} className="w-full">
                  <TabsList className="grid grid-cols-4 w-full h-11 bg-muted/40 p-1 rounded-lg">
                    {columns.map(col => (
                      <TabsTrigger key={col.title} value={col.title} className="text-[10px] font-bold px-0">
                        {col.title.split(' ')[0]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {columns.map(col => {
                    const columnLotes = filteredLotes.filter(l => col.statuses.includes(l.status!));
                    return (
                      <TabsContent key={col.title} value={col.title} className="space-y-4 pt-4">
                        {columnLotes.length > 0 ? (
                          columnLotes.map(renderLoteCard)
                        ) : (
                          <div className="text-center text-muted-foreground py-16 border border-dashed rounded-lg bg-muted/20">
                            Nenhum lote nesta fase.
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            </>
          );
        })()
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          {searchTerm ? (
            <>
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">Nenhum resultado encontrado</h2>
              <p className="text-muted-foreground mt-2">
                Não encontramos lotes correspondentes a &quot;{searchTerm}&quot;.
              </p>
              <Button variant="link" onClick={() => setFilters({ ...filters, searchTerm: '' })} className="mt-2 text-primary">
                Limpar filtro
              </Button>
            </>
          ) : (
            <>
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">Nenhum lote de garantia encontrado</h2>
              <p className="text-muted-foreground mt-2">
                Clique em &quot;Novo Lote&quot; no menu superior para começar a agrupar suas garantias.
              </p>
            </>
          )}
        </div>
      )}

      <Dialog open={isNewLoteModalOpen} onOpenChange={(open) => {
        setNewLoteModalOpen(open);
        if (!open) {
          setEditingLote(null);
        }
      }}>
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
