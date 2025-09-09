'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Lote } from '@/lib/types';
import * as db from '@/lib/db';

export default function LotesSection() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const { toast } = useToast();

  const loadLotes = useCallback(async () => {
    try {
      await db.initDB();
      const allLotes = await db.getAllLotes();
      setLotes(allLotes);
    } catch (error) {
      console.error('Failed to load lotes:', error);
      toast({
        title: 'Erro ao Carregar Lotes',
        description: 'Não foi possível carregar os lotes de garantia.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    loadLotes();
  }, [loadLotes]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lotes de Garantia</h1>
        <p className="text-lg text-muted-foreground">
          Agrupe, envie e gerencie suas garantias para fornecedores.
        </p>
      </div>
       <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">Funcionalidade em Construção</h2>
          <p className="text-muted-foreground mt-2">
            Esta seção está sendo desenvolvida para gerenciar lotes de garantia.
          </p>
       </div>
    </div>
  );
}
