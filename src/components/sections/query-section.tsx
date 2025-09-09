'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Warranty } from '@/lib/types';
import * as db from '@/lib/db';

import WarrantyTable from '@/components/warranty-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function QuerySection() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [isDbReady, setIsDbReady] = useState(false);
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
  }, [loadWarranties, toast]);

  const handleEdit = (warranty: Warranty) => {
    // For now, we just log this. We could navigate to the form with the item to edit.
    console.log('Editing:', warranty);
    toast({
        title: 'Edição em Breve',
        description: 'A funcionalidade para editar a partir daqui será implementada em breve.'
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await db.deleteWarranty(id);
      toast({ title: 'Sucesso', description: 'Garantia excluída com sucesso.' });
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
  
  if (!isDbReady) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  return (
     <WarrantyTable
        warranties={warranties}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
  );
}
