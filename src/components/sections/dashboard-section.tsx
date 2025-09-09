'use client';

import { useEffect, useState } from 'react';
import type { Warranty } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, ShieldCheck, Hourglass, BarChart3, ShieldX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  total: number;
  totalDefeitos: number;
  pendentes: number;
  aprovadas: number;
  recusadas: number;
}

export default function DashboardSection() {
  const [stats, setStats] = useState<DashboardStats>({ total: 0, totalDefeitos: 0, pendentes: 0, aprovadas: 0, recusadas: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        await db.initDB();
        const allWarranties = await db.getAllWarranties();
        
        const totalDefeitos = allWarranties.reduce((acc, warranty) => {
            return acc + (warranty.quantidade ?? 0);
        }, 0);

        const pendentes = allWarranties.filter(w => w.status === 'Em análise').length;
        const aprovadas = allWarranties.filter(w => w.status === 'Aprovada').length;
        const recusadas = allWarranties.filter(w => w.status === 'Recusada').length;

        setStats({
          total: allWarranties.length,
          totalDefeitos: totalDefeitos,
          pendentes,
          aprovadas,
          recusadas,
        });
      } catch (error) {
        console.error('Failed to load warranty stats:', error);
        toast({
          title: 'Erro ao Carregar Estatísticas',
          description: 'Não foi possível carregar os dados do dashboard.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, [toast]);

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-lg text-muted-foreground">
                    Um resumo das suas garantias registradas.
                </p>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="shadow-md hover:border-primary transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Garantias</CardTitle>
                    <BarChart3 className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.total}</div>}
                    <p className="text-xs text-muted-foreground">
                        Total de registros no sistema
                    </p>
                </CardContent>
            </Card>
             <Card className="shadow-md hover:border-amber-500 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Garantias Pendentes</CardTitle>
                    <Hourglass className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.pendentes}</div>}
                    <p className="text-xs text-muted-foreground">
                        Aguardando retorno do fornecedor
                    </p>
                </CardContent>
            </Card>
             <Card className="shadow-md hover:border-green-500 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Garantias Aprovadas</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.aprovadas}</div>}
                    <p className="text-xs text-muted-foreground">
                        Crédito ou peça nova recebida
                    </p>
                </CardContent>
            </Card>
            <Card className="shadow-md hover:border-red-500 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Garantias Recusadas</CardTitle>
                    <ShieldX className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.recusadas}</div>}
                    <p className="text-xs text-muted-foreground">
                        Negadas pelo fornecedor
                    </p>
                </CardContent>
            </Card>
             <Card className="shadow-md hover:border-destructive transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Itens com Defeito</CardTitle>
                    <Wrench className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.totalDefeitos}</div>}
                    <p className="text-xs text-muted-foreground">
                        Soma das quantidades com defeito
                    </p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
