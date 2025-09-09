'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Warranty } from '@/lib/types';
import * as db from '@/lib/db';

import WarrantyForm from '@/components/warranty-form';
import WarrantyTable from '@/components/warranty-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function WarrantyFormSection() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function initializeDB() {
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
  }, [toast]);

  const loadWarranties = async () => {
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
      setEditingWarranty(null);
      await loadWarranties();
    } catch (error) {
      console.error('Failed to save warranty:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar a garantia.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (warranty: Warranty) => {
    setEditingWarranty(warranty);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    try {
      await db.deleteWarranty(id);
      toast({ title: 'Sucesso', description: 'Garantia excluída com sucesso.' });
      setEditingWarranty(null);
      await loadWarranties();
    } catch (error) {
      console.error('Failed to delete warranty:', error);
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir a garantia.',
        variant: 'destructive',
      });
    }
  };

  const handleClearForm = () => {
    setEditingWarranty(null);
  };
  
  if (!isDbReady) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Skeleton className="h-[700px] w-full" />
        </div>
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 lg:sticky top-8">
        <WarrantyForm
          key={editingWarranty?.id ?? 'new'}
          selectedWarranty={editingWarranty}
          onSave={handleSave}
          onClear={handleClearForm}
        />
      </div>
      <div className="lg:col-span-2 space-y-8">
        <WarrantyTable
          warranties={warranties}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
