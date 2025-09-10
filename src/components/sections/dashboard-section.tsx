'use client';

import { useEffect, useState } from 'react';
import type { Warranty } from '@/lib/types';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wrench, ShieldCheck, Hourglass, BarChart3, ShieldX, CheckCircle, Users, Building, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from 'recharts';
import { format, subMonths, startOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';


interface DashboardStats {
  total: number;
  totalDefeitos: number;
  pendentes: number;
  aprovadas: number;
  recusadas: number;
  pagas: number;
}

interface MonthlyData {
    name: string;
    total: number;
}

interface RankingData {
    name: string;
    total: number;
}

const chartConfig = {
  total: {
    label: "Total",
  },
  pendentes: {
    label: "Pendentes",
    color: "hsl(var(--chart-2))",
  },
  aprovadas: {
    label: "Aprovadas",
    color: "hsl(var(--chart-1))",
  },
  recusadas: {
    label: "Recusadas",
    color: "hsl(var(--chart-5))",
  },
  pagas: {
    label: "Pagas",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

const COLORS = {
    'Em análise': 'hsl(var(--chart-2))',
    'Aprovada': 'hsl(var(--chart-1))',
    'Recusada': 'hsl(var(--chart-5))',
    'Paga': 'hsl(var(--primary))',
};

export default function DashboardSection() {
  const [stats, setStats] = useState<DashboardStats>({ total: 0, totalDefeitos: 0, pendentes: 0, aprovadas: 0, recusadas: 0, pagas: 0 });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [supplierRanking, setSupplierRanking] = useState<RankingData[]>([]);
  const [personRanking, setPersonRanking] = useState<RankingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadStats = async () => {
    setIsLoading(true);
    try {
      await db.initDB();
      const allWarranties = await db.getAllWarranties();
      
      const totalDefeitos = allWarranties.reduce((acc, warranty) => {
          return acc + (warranty.quantidade ?? 0);
      }, 0);

      const statusCounts = {
        'Em análise': allWarranties.filter(w => w.status === 'Em análise').length,
        'Aprovada': allWarranties.filter(w => w.status === 'Aprovada').length,
        'Recusada': allWarranties.filter(w => w.status === 'Recusada').length,
        'Paga': allWarranties.filter(w => w.status === 'Paga').length,
      };

      setStats({
        total: allWarranties.length,
        totalDefeitos: totalDefeitos,
        pendentes: statusCounts['Em análise'],
        aprovadas: statusCounts['Aprovada'],
        recusadas: statusCounts['Recusada'],
        pagas: statusCounts['Paga'],
      });
      
      setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value, fill: COLORS[name as keyof typeof COLORS] })));
      
      // Monthly data for the last 12 months
      const now = new Date();
      const monthlyCounts: { [key: string]: number } = {};
      for (let i = 11; i >= 0; i--) {
          const month = subMonths(now, i);
          const monthKey = format(month, 'MMM/yy', { locale: ptBR });
          monthlyCounts[monthKey] = 0;
      }

      allWarranties.forEach(w => {
          if (w.dataRegistro) {
              const monthKey = format(parseISO(w.dataRegistro), 'MMM/yy', { locale: ptBR });
              if (monthKey in monthlyCounts) {
                  monthlyCounts[monthKey]++;
              }
          }
      });
      
      setMonthlyData(Object.entries(monthlyCounts).map(([name, total]) => ({ name, total })));

      // Supplier Ranking
      const supplierCounts: Record<string, number> = {};
      allWarranties.forEach(w => {
          if(w.fornecedor) {
            supplierCounts[w.fornecedor] = (supplierCounts[w.fornecedor] || 0) + 1;
          }
      });
      setSupplierRanking(Object.entries(supplierCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, total]) => ({name, total})));

      // Person Ranking (Client/Mechanic)
      const personCounts: Record<string, number> = {};
       allWarranties.forEach(w => {
          if(w.cliente) personCounts[w.cliente] = (personCounts[w.cliente] || 0) + 1;
          if(w.mecanico && w.mecanico !== w.cliente) personCounts[w.mecanico] = (personCounts[w.mecanico] || 0) + 1;
      });
      setPersonRanking(Object.entries(personCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, total]) => ({name, total})));


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

  useEffect(() => {
    const handleDataChanged = () => {
        loadStats();
    };

    loadStats();
    window.addEventListener('datachanged', handleDataChanged);

    return () => {
        window.removeEventListener('datachanged', handleDataChanged);
    };
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

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
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
             <Card className="shadow-md hover:border-blue-500 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Garantias Pagas</CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.pagas}</div>}
                    <p className="text-xs text-muted-foreground">
                        Finalizadas e pagas ao cliente
                    </p>
                </CardContent>
            </Card>
            <Card className="shadow-md hover:border-destructive transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Garantias Recusadas</CardTitle>
                    <ShieldX className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.recusadas}</div>}
                    <p className="text-xs text-muted-foreground">
                        Negadas pelo fornecedor
                    </p>
                </CardContent>
            </Card>
            <Card className="shadow-md hover:border-red-500 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Itens com Defeito</CardTitle>
                    <Wrench className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.totalDefeitos}</div>}
                    <p className="text-xs text-muted-foreground">
                        Soma das quantidades com defeito
                    </p>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="shadow-lg lg:col-span-2">
                <CardHeader>
                    <CardTitle>Status das Garantias</CardTitle>
                    <CardDescription>Distribuição dos status de todas as garantias.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-48 w-full" /> : (
                        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                    {statusData.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-lg lg:col-span-5">
                <CardHeader>
                    <CardTitle>Garantias por Mês</CardTitle>
                    <CardDescription>Volume de registros nos últimos 12 meses.</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading ? <Skeleton className="h-48 w-full" /> : (
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <BarChart accessibilityLayer data={monthlyData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={4} />
                            </BarChart>
                        </ChartContainer>
                     )}
                </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg">
                <CardHeader>
                    <div className='flex items-center gap-2'>
                        <Building className="h-5 w-5 text-muted-foreground"/>
                        <CardTitle>Top 5 Fornecedores com Garantias</CardTitle>
                    </div>
                    <CardDescription>Fornecedores com maior número de registros de garantia.</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading ? <Skeleton className="h-48 w-full" /> : (
                         <div className='space-y-4'>
                            {supplierRanking.length > 0 ? supplierRanking.map(item => (
                                <div key={item.name} className='flex items-center justify-between'>
                                    <span className='text-sm text-muted-foreground'>{item.name}</span>
                                    <span className='font-bold'>{item.total}</span>
                                </div>
                            )) : <p className='text-sm text-muted-foreground text-center py-8'>Nenhum dado de fornecedor para exibir.</p>}
                         </div>
                     )}
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                <CardHeader>
                    <div className='flex items-center gap-2'>
                        <Users className="h-5 w-5 text-muted-foreground"/>
                        <CardTitle>Top 5 Clientes/Mecânicos</CardTitle>
                    </div>
                    <CardDescription>Clientes e mecânicos com maior número de garantias.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-48 w-full" /> : (
                         <div className='space-y-4'>
                            {personRanking.length > 0 ? personRanking.map(item => (
                                <div key={item.name} className='flex items-center justify-between'>
                                    <span className='text-sm text-muted-foreground'>{item.name}</span>
                                    <span className='font-bold'>{item.total}</span>
                                </div>
                            )) : <p className='text-sm text-muted-foreground text-center py-8'>Nenhum dado de cliente/mecânico para exibir.</p>}
                         </div>
                     )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
