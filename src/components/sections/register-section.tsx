'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Warranty } from '@/lib/types';
import * as db from '@/lib/db';

import WarrantyForm from '@/components/warranty-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function RegisterSection() {
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function initializeDB() {
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
    initializeDB();
  }, [toast]);

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
    } catch (error) {
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
  
  if (!isDbReady) {
    return <Skeleton className="h-[700px] w-full" />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <WarrantyForm
        key={editingWarranty?.id ?? 'new'}
        selectedWarranty={editingWarranty}
        onSave={handleSave}
        onClear={handleClearForm}
      />
    </div>
  );
}
