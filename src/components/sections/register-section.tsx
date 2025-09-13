'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Warranty } from '@/lib/types';
import * as db from '@/lib/db';
import type { RegisterMode } from '@/app/page';

import WarrantyForm from '@/components/warranty-form';
import { Skeleton } from '@/components/ui/skeleton';

interface RegisterSectionProps {
    editingId: number | null;
    mode: RegisterMode;
    onSave: () => void;
    onClear: () => void;
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
          const { id, dataRegistro, ...clonedData } = data;
          setWarrantyToLoad({
            ...clonedData,
            status: 'Em análise' // Reset status for the new cloned item
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


  const handleSave = async (data: Warranty) => {
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
      onSave(); // Navigates back
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
    <div className="max-w-5xl mx-auto">
      <WarrantyForm
        key={warrantyToLoad?.id ?? editingId ?? 'new'}
        selectedWarranty={warrantyToLoad}
        onSave={handleSave}
        onClear={onClear}
        isClone={mode === 'clone'}
      />
    </div>
  );
}
