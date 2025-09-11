'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export default function DevolucaoRegisterSection() {
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
  
  if (!isDbReady) {
    return <Skeleton className="h-[700px] w-full" />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader>
            <CardTitle>Cadastro de Devolução</CardTitle>
            <CardDescription>
                Registre uma nova devolução com um ou mais itens.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p>O formulário de cadastro de devolução será implementado aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}
