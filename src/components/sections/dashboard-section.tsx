'use client';

import { useEffect, useState, useCallback } from 'react';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wrench, ShieldCheck, Hourglass, BarChart3, ShieldX, Users, Building, DollarSign, Undo, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart as RechartsPieChart, Cell } from 'recharts';
import { format, parseISO, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Devolucao, ItemDevolucao } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos para Garantias
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

interface StatusChartData {
    name: string;
    value: number;
    fill: string;
}

type DevolucaoFlat = Omit<Devolucao, 'id' | 'itens'> & Partial<ItemDevolucao> & { id: number; itemId?: number };

// Tipos para Devoluções
interface DevolucaoStats {
    totalDevolucoes: number;
    totalPecas: number;
    clientesUnicos: number;
    mecanicosUnicos: number;
}

interface DashboardSectionProps {
    setActiveView: (view: string) => void;
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

export default function DashboardSection({ setActiveView }: DashboardSectionProps) {
  // Estado para Garantias
  const [stats, setStats] = useState<DashboardStats>({ total: 0, totalDefeitos: 0, pendentes: 0, aprovadas: 0, recusadas: 0, pagas: 0 });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [statusData, setStatusData] = useState<StatusChartData[]>([]);
  const [supplierRanking, setSupplierRanking] = useState<RankingData[]>([]);
  const [personRanking, setPersonRanking] = useState<RankingData[]>([]);

  // Estado para Devoluções
  const [devolucaoStats, setDevolucaoStats] = useState<DevolucaoStats | null>(null);
  const [recentDevolucoes, setRecentDevolucoes] = useState<DevolucaoFlat[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      await db.initDB();
      const [allWarranties, allDevolucoes] = await Promise.all([
          db.getAllWarranties(),
          db.getAllDevolucoes(),
      ]);
      
      // --- Cálculo de Garantias ---
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
      const supplierCounts: Record<string, number> = {};
      allWarranties.forEach(w => {
          if(w.fornecedor) {
            supplierCounts[w.fornecedor] = (supplierCounts[w.fornecedor] || 0) + 1;
          }
      });
      setSupplierRanking(Object.entries(supplierCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, total]) => ({name, total})));
      const personCounts: Record<string, number> = {};
       allWarranties.forEach(w => {
          if(w.cliente) personCounts[w.cliente] = (personCounts[w.cliente] || 0) + 1;
          if(w.mecanico && w.mecanico !== w.cliente) personCounts[w.mecanico] = (personCounts[w.mecanico] || 0) + 1;
      });
      setPersonRanking(Object.entries(personCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, total]) => ({name, total})));


      // --- Cálculo de Devoluções ---
        const flatItems = allDevolucoes.flatMap(d => d.itens.map(i => ({...i, dev: d})));

        const sortedDevolucoes = allDevolucoes.sort((a, b) => {
            if (!b.dataDevolucao || !a.dataDevolucao) return 0;
            return parseISO(b.dataDevolucao).getTime() - parseISO(a.dataDevolucao).getTime()
        });
        const recentFlatDevolucoes = sortedDevolucoes.flatMap(devolucao => {
            if (!devolucao.itens || allDevolucoes.length === 0) {
                return [{ ...devolucao, id: devolucao.id! }];
            }
            return devolucao.itens.map(item => ({
                ...devolucao, ...item, id: devolucao.id!, itemId: item.id!,
            }));
        }).slice(0, 5);
        setRecentDevolucoes(recentFlatDevolucoes);
        
        setDevolucaoStats({
            totalDevolucoes: allDevolucoes.length,
            totalPecas: flatItems.reduce((acc, item) => acc + item.quantidade, 0),
            clientesUnicos: new Set(allDevolucoes.map(d => d.cliente)).size,
            mecanicosUnicos: new Set(allDevolucoes.map(d => d.mecanico).filter(Boolean)).size,
        });


    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      toast({
        title: 'Erro ao Carregar Estatísticas',
        description: 'Não foi possível carregar os dados do dashboard.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const handleDataChanged = () => {
        loadStats();
    };

    loadStats();
    window.addEventListener('datachanged', handleDataChanged);

    return () => {
        window.removeEventListener('datachanged', handleDataChanged);
    };
  }, [loadStats]);
  

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-lg text-muted-foreground">
                    Um resumo das suas operações registradas.
                </p>
            </div>
        </div>

        <Tabs defaultValue="garantias" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="garantias" className={cn("border-2 border-transparent data-[state=active]:border-primary")}>Garantias</TabsTrigger>
                <TabsTrigger value="devolucoes" className={cn("border-2 border-transparent data-[state=active]:border-[hsl(var(--accent-blue))]")}>Devoluções</TabsTrigger>
            </TabsList>
            <TabsContent value="garantias" className="mt-6">
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
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
                    <Card className="shadow-lg lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Status das Garantias</CardTitle>
                            <CardDescription>Distribuição dos status de todas as garantias.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-48 w-full" /> : (
                                <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                                    <RechartsPieChart>
                                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                        <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                            {statusData.map((entry) => (
                                                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                    </RechartsPieChart>
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
                
                <div className="grid gap-6 md:grid-cols-2 mt-6">
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

            </TabsContent>
            <TabsContent value="devolucoes" className="mt-6">
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-md hover:border-primary transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Devoluções</CardTitle>
                            <Undo className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{devolucaoStats?.totalDevolucoes}</div>}
                            <p className="text-xs text-muted-foreground">Total de registros</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-md hover:border-blue-500 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Peças</CardTitle>
                            <Package className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{devolucaoStats?.totalPecas}</div>}
                            <p className="text-xs text-muted-foreground">Itens devolvidos</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-md hover:border-green-500 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
                            <Users className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{devolucaoStats?.clientesUnicos}</div>}
                             <p className="text-xs text-muted-foreground">Que fizeram devoluções</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-md hover:border-amber-500 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mecânicos Únicos</CardTitle>
                            <Building className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{devolucaoStats?.mecanicosUnicos}</div>}
                            <p className="text-xs text-muted-foreground">Envolvidos em devoluções</p>
                        </CardContent>
                    </Card>
                </div>
                <Card className="mt-6 shadow-lg">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle>Devoluções Recentes</CardTitle>
                            <CardDescription>As 5 devoluções mais recentes registradas no sistema.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setActiveView('devolucao-query')}>
                            Ver Todas
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className='h-48 w-full' /> : (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Peça</TableHead>
                                        <TableHead className='text-center'>Quantidade</TableHead>
                                        <TableHead>Requisição</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentDevolucoes.length > 0 ? (
                                        recentDevolucoes.map(item => (
                                            <TableRow key={`${item.id}-${item.itemId || 'no-item'}`}>
                                                <TableCell>{item.dataDevolucao ? format(parseISO(item.dataDevolucao), 'dd/MM/yyyy') : '-'}</TableCell>
                                                <TableCell className="font-medium">{item.cliente}</TableCell>
                                                <TableCell>
                                                    <div className='font-medium'>{item.codigoPeca}</div>
                                                    <div className='text-xs text-muted-foreground'>{item.descricaoPeca}</div>
                                                </TableCell>
                                                <TableCell className='text-center'>
                                                    <Badge variant="secondary">{item.quantidade}</Badge>
                                                </TableCell>
                                                <TableCell>{item.requisicaoVenda}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">Nenhuma devolução registrada ainda.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
