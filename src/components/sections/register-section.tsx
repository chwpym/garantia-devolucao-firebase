

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Warranty, RegisterMode } from '@/lib/types';
import * as db from '@/lib/db';

import WarrantyForm from '@/components/warranty-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { SearchX, LayoutList, Clock, CalendarIcon } from 'lucide-react';
import { isSameDay, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatusBadge } from '@/components/ui/status-badge';
import { DatePicker } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RegisterSectionProps {
  editingId: number | null;
  mode: RegisterMode;
  onSave: (shouldNavigate: boolean) => void;
  onClear: () => void;
}

function RecentWarrantiesList() {
  const [recentWarranties, setRecentWarranties] = useState<Warranty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const fetchRecent = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await db.getAllWarranties();
      const filtered = selectedDate 
        ? all.filter(w => w.dataRegistro && isSameDay(parseISO(w.dataRegistro), selectedDate))
        : all;
      
      const sorted = filtered.sort((a, b) => b.id! - a.id!);
      setRecentWarranties(sorted);
    } catch (error) {
      console.error('Failed to fetch recent warranties:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchRecent();
    window.addEventListener('datachanged', fetchRecent);
    return () => window.removeEventListener('datachanged', fetchRecent);
  }, [fetchRecent]);

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <Card className="min-h-full h-full border-muted/40 shadow-sm flex flex-col bg-transparent lg:bg-card">
      <CardHeader className="py-4 px-4 border-b bg-muted/5 space-y-3 flex-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Lançamentos</CardTitle>
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="h-3 w-3" />
            Filtro por data
          </label>
          <DatePicker 
            date={selectedDate} 
            setDate={setSelectedDate} 
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-muted">
        {recentWarranties.length > 0 ? (
          recentWarranties.map((w) => (
            <TooltipProvider key={w.id}>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors cursor-default group text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">#{w.id}</span>
                      <StatusBadge type="warranty" status={w.status} className="h-5 text-[10px] px-1.5 py-0" />
                    </div>
                    <div className="w-full">
                      <span className="text-xs font-semibold truncate block" title={w.cliente}>{w.cliente}</span>
                    </div>
                    <div className="w-full mt-1">
                      <span className="text-[10px] text-muted-foreground font-mono truncate block" title={w.codigo || 'Sem código'}>
                        {w.codigo ? w.codigo : 'Sem produto/código'}
                        {w.descricao ? ` - ${w.descricao}` : ''}
                      </span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="w-[280px] p-3 shadow-lg border">
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground mb-0.5">REGISTRADO EM</p>
                      <p className="text-xs font-medium">{w.dataRegistro ? format(parseISO(w.dataRegistro), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data Indisponível'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground mb-0.5">CLIENTE</p>
                      <p className="text-xs font-semibold">{w.cliente}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground mb-0.5">PRODUTO</p>
                      <p className="text-xs">{w.codigo || 'Sem código'}{w.descricao ? ` - ${w.descricao}` : ''}</p>
                    </div>
                    {w.defeito && (
                      <div>
                        <p className="text-[10px] font-mono text-muted-foreground mb-0.5">DEFEITO APRESENTADO</p>
                        <p className="text-xs italic">"{w.defeito}"</p>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-muted-foreground">
            <LayoutList className="h-8 w-8 opacity-20" />
            <p className="text-xs italic">Nenhum registro hoje.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RegisterSection({ editingId, mode, onSave, onClear }: RegisterSectionProps) {
  const [warrantyToLoad, setWarrantyToLoad] = useState<Warranty | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const { toast } = useToast();

  const loadWarranty = useCallback(async () => {
    if (!editingId) {
      setWarrantyToLoad(null);
      return;
    }
    setIsLoadingData(true);
    try {
      const data = await db.getWarrantyById(editingId);
      if (data) {
        if (mode === 'clone') {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, dataRegistro, loteId, status, ...clonedData } = data;
          setWarrantyToLoad({
            ...clonedData,
            status: 'Aguardando Envio' // Reset status for the new cloned item
          });
        } else {
          setWarrantyToLoad(data);
        }
      } else {
        toast({ title: 'Erro', description: 'Garantia para edição não encontrada.', variant: 'destructive' });
        onClear();
      }
    } catch (error) {
      console.error('Failed to load warranty:', error);
      toast({ title: 'Erro ao Carregar', description: 'Não foi possível carregar os dados da garantia.', variant: 'destructive' });
    } finally {
      setIsLoadingData(false);
    }
  }, [editingId, mode, onClear, toast]);


  useEffect(() => {
    async function initialize() {
      try {
        await db.initDB();
        setIsDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        toast({
          title: 'Erro de Banco de Dados',
          description: 'Não foi possível carregar o banco de dados local.',
          variant: 'destructive',
        });
      }
    }
    initialize();
  }, [toast]);

  useEffect(() => {
    if (isDbReady) {
      if (editingId) {
        loadWarranty();
      } else {
        setWarrantyToLoad(null);
      }
    }
  }, [isDbReady, editingId, loadWarranty]);


  const handleSave = async (data: Warranty, shouldNavigate: boolean) => {
    try {
      const isCloning = mode === 'clone';

      if (data.id && !isCloning) {
        await db.updateWarranty(data);
        toast({ title: 'Sucesso', description: 'Garantia atualizada com sucesso.' });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...dataWithoutId } = data;
        await db.addWarranty(dataWithoutId);
        toast({ title: 'Sucesso', description: `Garantia ${isCloning ? 'clonada' : 'salva'} com sucesso.` });
      }
      onSave(shouldNavigate); // Passa a informação se deve navegar ou não
    } catch (error) {
      console.error('Failed to save warranty:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar a garantia.',
        variant: 'destructive',
      });
    }
  };

  if (!isDbReady || (editingId && isLoadingData)) {
    return <Skeleton className="h-[700px] w-full" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-full h-full overflow-hidden min-h-0">
      <div className="lg:col-span-3 h-full overflow-hidden pr-1">
        <WarrantyForm
          key={editingId ? `${editingId}-${mode}` : 'new'}
          selectedWarranty={warrantyToLoad}
          onSave={handleSave}
          onClear={onClear}
          isClone={mode === 'clone'}
        />
      </div>
      <div className="lg:col-span-1 h-full overflow-hidden">
        <RecentWarrantiesList />
      </div>
    </div>
  );
}
