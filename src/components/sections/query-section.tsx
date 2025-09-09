'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Warranty } from '@/lib/types';
import * as db from '@/lib/db';
import { Search } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, parseISO } from 'date-fns';

import WarrantyTable from '@/components/warranty-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import WarrantyForm from '../warranty-form';

export default function QuerySection() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -90),
    to: new Date(),
  });
  const { toast } = useToast();

  const loadWarranties = useCallback(async () => {
    try {
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

  const refreshData = useCallback(() => {
    loadWarranties();
    window.dispatchEvent(new CustomEvent('datachanged'));
  }, [loadWarranties]);

  useEffect(() => {
    async function initializeDB() {
      if (isDbReady) {
        loadWarranties();
        return;
      }
      try {
        await db.initDB();
        setIsDbReady(true);
        await loadWarranties();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        toast({
          title: 'Erro de Banco de Dados',
          description: 'Não foi possível carregar o banco de dados local.',
          variant: 'destructive',
        });
      }
    }
    initializeDB();
    
    window.addEventListener('datachanged', refreshData);
    
    return () => {
        window.removeEventListener('datachanged', refreshData);
    }
  }, [loadWarranties, toast, isDbReady, refreshData]);

  const handleEdit = (warranty: Warranty) => {
    setEditingWarranty(warranty);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleSave = async (data: Omit<Warranty, 'id'>, id?: number) => {
    try {
      if (id) {
        await db.updateWarranty({ ...data, id });
        toast({ title: 'Sucesso', description: 'Garantia atualizada com sucesso.' });
      } else {
        await db.addWarranty(data);
        toast({ title: 'Sucesso', description: 'Garantia salva com sucesso.' });
      }
      setEditingWarranty(null); // Clear editing state
      refreshData(); // Refresh data
    } catch (error)      {
      console.error('Failed to save warranty:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar a garantia.',
        variant: 'destructive',
      });
    }
  };

  const handleClearForm = () => {
    setEditingWarranty(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await db.deleteWarranty(id);
      toast({
        title: 'Sucesso',
        description: 'Garantia excluída com sucesso.',
      });
      refreshData();
    } catch (error) {
      console.error('Failed to delete warranty:', error);
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir a garantia.',
        variant: 'destructive',
      });
    }
  };

  const filteredWarranties = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    
    return warranties.filter(warranty => {
      // Date filter
      const { from, to } = dateRange || {};
      if (from && warranty.dataRegistro) {
        if (parseISO(warranty.dataRegistro) < from) return false;
      }
      if (to && warranty.dataRegistro) {
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
        warranty.requisicoes?.toLowerCase().includes(lowercasedTerm)
      );
    });
  }, [searchTerm, warranties, dateRange]);

  if (!isDbReady) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className='space-y-8'>
        {editingWarranty && (
            <div className="mb-8">
                 <WarrantyForm
                    key={editingWarranty?.id ?? 'edit'}
                    selectedWarranty={editingWarranty}
                    onSave={handleSave}
                    onClear={handleClearForm}
                />
            </div>
        )}
        <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Garantias Registradas</CardTitle>
            <CardDescription>
            Visualize, edite e exclua as garantias cadastradas.
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
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
            <WarrantyTable
            warranties={filteredWarranties}
            onEdit={handleEdit}
            onDelete={handleDelete}
            />
        </CardContent>
        </Card>
    </div>
  );
}
