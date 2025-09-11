
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Devolucao, ItemDevolucao, Person } from '@/lib/types';
import * as db from '@/lib/db';
import { format, parseISO, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Undo, Wrench, Users, UserCog, BarChart3, PieChart, User, FileDown } from 'lucide-react';
import { DatePickerWithRange } from '../ui/date-range-picker';
import { Badge } from '../ui/badge';
import { Combobox } from '../ui/combobox';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateDevolucoesPdf } from '@/lib/pdf-generator';
import { Label } from '../ui/label';


type DevolucaoComItens = Devolucao & { itens: ItemDevolucao[] };

interface ReportData {
  totalDevolucoes: number;
  totalPecas: number;
  clientesUnicos: number;
  mecanicosUnicos: number;
  porPeca: { codigo: string; descricao: string; qtdTotal: number; ocorrencias: number }[];
  porCliente: { nome: string; qtdTotal: number; ocorrencias: number; pecasDistintas: number }[];
  porMecanico: { nome: string; qtdTotal: number; ocorrencias: number; clientesUnicos: number }[];
  porAcao: { acao: string; qtdTotal: number; ocorrencias: number }[];
}

interface ClientReportFilters {
    client: string;
    month: string;
    year: string;
}

const months = [
    { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" }, { value: "3", label: "Março" },
    { value: "4", label: "Abril" }, { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
    { value: "7", label: "Julho" }, { value: "8", label: "Agosto" }, { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" }, { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

export default function DevolucaoReportSection() {
  const [allDevolucoes, setAllDevolucoes] = useState<DevolucaoComItens[]>([]);
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const [clientReportFilters, setClientReportFilters] = useState<ClientReportFilters>({
    client: '',
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString()
  });
  const [clientReportData, setClientReportData] = useState<DevolucaoComItens[] | null>(null);

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await db.initDB();
      const [devolucoes, persons] = await Promise.all([
          db.getAllDevolucoes(),
          db.getAllPersons(),
      ]);
      setAllDevolucoes(devolucoes);
      setAllPersons(persons);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Erro ao Carregar Dados',
        description: 'Não foi possível carregar os dados de devoluções.',
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
    window.addEventListener('datachanged', loadData);
    return () => window.removeEventListener('datachanged', loadData);
  }, [loadData]);
  
  const filteredDevolucoes = useMemo(() => {
    return allDevolucoes.filter(item => {
      const { from, to } = dateRange || {};
      if (from && item.dataDevolucao) {
        if (parseISO(item.dataDevolucao) < from) return false;
      }
      if (to && item.dataDevolucao) {
        const toDate = addDays(to, 1);
        if (parseISO(item.dataDevolucao) >= toDate) return false;
      }
      return true;
    });
  }, [allDevolucoes, dateRange]);
  
  const generateReports = useCallback(() => {
    if (filteredDevolucoes.length === 0) {
        setReportData(null);
        toast({
            title: 'Nenhum dado no período',
            description: 'Não há devoluções no período selecionado para gerar relatórios.',
        });
        return;
    }

    const flatItems = filteredDevolucoes.flatMap(d => d.itens.map(i => ({...i, dev: d})));

    // Stats
    const totalDevolucoes = filteredDevolucoes.length;
    const totalPecas = flatItems.reduce((acc, item) => acc + item.quantidade, 0);
    const clientesUnicos = new Set(filteredDevolucoes.map(d => d.cliente)).size;
    const mecanicosUnicos = new Set(filteredDevolucoes.map(d => d.mecanico).filter(Boolean)).size;

    // Por Peça
    const pecaStats: Record<string, { codigo: string; descricao: string; qtdTotal: number; ocorrencias: number }> = {};
    flatItems.forEach(item => {
        const key = item.codigoPeca;
        if (!pecaStats[key]) {
            pecaStats[key] = { codigo: item.codigoPeca, descricao: item.descricaoPeca, qtdTotal: 0, ocorrencias: 0 };
        }
        pecaStats[key].qtdTotal += item.quantidade;
        pecaStats[key].ocorrencias += 1;
    });
    const porPeca = Object.values(pecaStats).sort((a,b) => b.qtdTotal - a.qtdTotal);

    // Por Cliente
    const clienteStats: Record<string, { nome: string; qtdTotal: number; ocorrencias: number; pecas: Set<string> }> = {};
    filteredDevolucoes.forEach(dev => {
        if (!clienteStats[dev.cliente]) {
            clienteStats[dev.cliente] = { nome: dev.cliente, qtdTotal: 0, ocorrencias: 0, pecas: new Set() };
        }
        clienteStats[dev.cliente].ocorrencias++;
        dev.itens.forEach(item => {
            clienteStats[dev.cliente].qtdTotal += item.quantidade;
            clienteStats[dev.cliente].pecas.add(item.codigoPeca);
        });
    });
    const porCliente = Object.values(clienteStats)
        .map(c => ({ nome: c.nome, qtdTotal: c.qtdTotal, ocorrencias: c.ocorrencias, pecasDistintas: c.pecas.size }))
        .sort((a, b) => b.qtdTotal - a.qtdTotal);

    // Por Mecanico
    const mecanicoStats: Record<string, { nome: string; qtdTotal: number; ocorrencias: number; clientes: Set<string> }> = {};
     filteredDevolucoes.forEach(dev => {
        if (!dev.mecanico) return;
        if (!mecanicoStats[dev.mecanico]) {
            mecanicoStats[dev.mecanico] = { nome: dev.mecanico, qtdTotal: 0, ocorrencias: 0, clientes: new Set() };
        }
        mecanicoStats[dev.mecanico].ocorrencias++;
        mecanicoStats[dev.mecanico].clientes.add(dev.cliente);
        dev.itens.forEach(item => {
            mecanicoStats[dev.mecanico].qtdTotal += item.quantidade;
        });
    });
    const porMecanico = Object.values(mecanicoStats)
        .map(m => ({ nome: m.nome, qtdTotal: m.qtdTotal, ocorrencias: m.ocorrencias, clientesUnicos: m.clientes.size }))
        .sort((a, b) => b.qtdTotal - a.qtdTotal);

    // Por Acao
    const acaoStats: Record<string, { acao: string; qtdTotal: number; ocorrencias: number }> = {};
    filteredDevolucoes.forEach(dev => {
        if (!acaoStats[dev.acaoRequisicao]) {
            acaoStats[dev.acaoRequisicao] = { acao: dev.acaoRequisicao, qtdTotal: 0, ocorrencias: 0 };
        }
        acaoStats[dev.acaoRequisicao].ocorrencias++;
        acaoStats[dev.acaoRequisicao].qtdTotal += dev.itens.reduce((sum, item) => sum + item.quantidade, 0);
    });
    const porAcao = Object.values(acaoStats).sort((a,b) => b.ocorrencias - a.ocorrencias);

    setReportData({
        totalDevolucoes,
        totalPecas,
        clientesUnicos,
        mecanicosUnicos,
        porPeca,
        porCliente,
        porMecanico,
        porAcao,
    });
  }, [filteredDevolucoes, toast]);


  const clientOptions = useMemo(() => {
    return allPersons
      .filter(p => p.tipo === 'Cliente' || p.tipo === 'Ambos')
      .map(c => ({ value: c.nome, label: c.nome }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allPersons]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>();
    years.add(currentYear);
    years.add(currentYear + 1);
    allDevolucoes.forEach(dev => {
      if (dev.dataDevolucao) {
        years.add(parseISO(dev.dataDevolucao).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allDevolucoes]);

  const handleGenerateClientReport = () => {
    const { client, month, year } = clientReportFilters;
    if (!client) {
      toast({ title: 'Aviso', description: 'Por favor, selecione um cliente.' });
      return;
    }

    const filtered = allDevolucoes.filter(dev => {
      const devDate = parseISO(dev.dataDevolucao);
      return (
        dev.cliente === client &&
        (devDate.getMonth() + 1).toString() === month &&
        devDate.getFullYear().toString() === year
      );
    });

    setClientReportData(filtered);
    if(filtered.length === 0) {
        toast({ title: 'Nenhum resultado', description: 'Nenhuma devolução encontrada para este cliente no período selecionado.'})
    }
  };
  
    const handleExportClientReportPdf = async () => {
    if (!clientReportData || clientReportData.length === 0) {
      toast({ title: 'Aviso', description: 'Não há dados para exportar.' });
      return;
    }
    
    // Flatten the data for the PDF generator
    const flatData = clientReportData.flatMap(devolucao => 
        devolucao.itens.map(item => ({
            ...devolucao,
            ...item,
            id: devolucao.id!,
            itemId: item.id!,
        }))
    );

    try {
      const companyData = await db.getCompanyData();
      const pdfDataUri = generateDevolucoesPdf({
        devolucoes: flatData,
        companyData,
        title: `Relatório de Devoluções - ${clientReportFilters.client}`
      });

      const link = document.createElement('a');
      const monthLabel = months.find(m => m.value === clientReportFilters.month)?.label;
      link.href = pdfDataUri;
      link.download = `relatorio_${clientReportFilters.client}_${monthLabel}_${clientReportFilters.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: 'Sucesso',
        description: 'Relatório do cliente gerado com sucesso.',
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast({
        title: 'Erro ao Gerar PDF',
        description: 'Não foi possível gerar o relatório. Tente novamente.',
        variant: 'destructive',
      });
    }
  };



  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios de Devoluções</h1>
        <p className="text-lg text-muted-foreground">
          Analise os dados de devoluções registradas no sistema.
        </p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Relatório Mensal por Cliente</CardTitle>
          <CardDescription>Selecione um cliente e o período para gerar um relatório detalhado.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Left Column */}
            <div className='space-y-4'>
                 <div>
                    <Label>Selecionar Cliente</Label>
                    <Combobox
                        options={clientOptions}
                        value={clientReportFilters.client}
                        onChange={(value) => setClientReportFilters(prev => ({...prev, client: value}))}
                        placeholder='Selecione um cliente...'
                        searchPlaceholder='Buscar cliente...'
                        notFoundMessage='Nenhum cliente encontrado.'
                        className='w-full'
                    />
                </div>
                 <Button onClick={handleGenerateClientReport} className='w-full sm:w-auto'>
                    <User className='mr-2 h-4 w-4' />
                    Gerar Relatório do Cliente
                </Button>
            </div>
            {/* Right Column */}
            <div className='grid grid-cols-2 gap-4'>
                <div>
                    <Label>Mês</Label>
                    <Select 
                        value={clientReportFilters.month} 
                        onValueChange={(value) => setClientReportFilters(prev => ({...prev, month: value}))}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {months.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Ano</Label>
                    <Select 
                        value={clientReportFilters.year} 
                        onValueChange={(value) => setClientReportFilters(prev => ({...prev, year: value}))}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {yearOptions.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>
        </CardContent>
        {clientReportData && (
             <CardFooter className='flex-col items-start gap-4 pt-6 mt-6 border-t'>
                 <div className='w-full space-y-4 animate-in fade-in-50'>
                     <div className='flex justify-between items-center'>
                        <h3 className='font-semibold'>Resultados para {clientReportFilters.client}</h3>
                        <Button variant='outline' onClick={handleExportClientReportPdf} disabled={clientReportData.length === 0}>
                            <FileDown className='mr-2 h-4 w-4' />
                            Exportar para PDF
                        </Button>
                     </div>
                     {/* Placeholder for client report table */}
                      <div className="border rounded-md p-6 text-center text-muted-foreground">
                        <p>Relatório do cliente aparecerá aqui.</p>
                        <p className='font-bold'>{clientReportData.length} devoluções encontradas.</p>
                      </div>
                 </div>
            </CardFooter>
        )}
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Relatórios Gerais</CardTitle>
          <CardDescription>Selecione o período para gerar os relatórios de resumo.</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col md:flex-row gap-4 items-center'>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            <Button onClick={generateReports} disabled={isLoading}>
                <BarChart3 className='mr-2 h-4 w-4' />
                Gerar Relatórios Gerais
            </Button>
        </CardContent>
      </Card>
      
      {isLoading && <Skeleton className="h-64 w-full" />}
      
      {reportData && (
        <div className='space-y-6 animate-in fade-in-50'>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className='shadow-md'>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Devoluções</CardTitle>
                        <Undo className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportData.totalDevolucoes}</div>
                        <p className="text-xs text-muted-foreground">Registros no período</p>
                    </CardContent>
                </Card>
                 <Card className='shadow-md'>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Peças</CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportData.totalPecas}</div>
                        <p className="text-xs text-muted-foreground">Itens devolvidos no período</p>
                    </CardContent>
                </Card>
                 <Card className='shadow-md'>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportData.clientesUnicos}</div>
                        <p className="text-xs text-muted-foreground">Clientes que fizeram devoluções</p>
                    </CardContent>
                </Card>
                 <Card className='shadow-md'>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mecânicos Únicos</CardTitle>
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportData.mecanicosUnicos}</div>
                        <p className="text-xs text-muted-foreground">Mecânicos envolvidos</p>
                    </CardContent>
                </Card>
            </div>
            
            {/* Detailed Reports */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'><Wrench className='h-5 w-5' /> Relatório por Peças</CardTitle>
                        <CardDescription>Peças mais devolvidas no período.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Descrição</TableHead><TableHead>Qtd.</TableHead><TableHead>Ocorrências</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {reportData.porPeca.slice(0,10).map(p => (
                                    <TableRow key={p.codigo}><TableCell className='font-medium'>{p.codigo}</TableCell><TableCell>{p.descricao}</TableCell><TableCell>{p.qtdTotal}</TableCell><TableCell>{p.ocorrencias}</TableCell></TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'><Users className='h-5 w-5' /> Relatório por Clientes</CardTitle>
                        <CardDescription>Clientes com mais devoluções no período.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Qtd. Peças</TableHead><TableHead>Devoluções</TableHead><TableHead>Peças Distintas</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {reportData.porCliente.slice(0,10).map(c => (
                                    <TableRow key={c.nome}><TableCell>{c.nome}</TableCell><TableCell>{c.qtdTotal}</TableCell><TableCell>{c.ocorrencias}</TableCell><TableCell>{c.pecasDistintas}</TableCell></TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'><UserCog className='h-5 w-5' /> Relatório por Mecânicos</CardTitle>
                        <CardDescription>Mecânicos com mais devoluções no período.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader><TableRow><TableHead>Mecânico</TableHead><TableHead>Qtd. Peças</TableHead><TableHead>Devoluções</TableHead><TableHead>Clientes Únicos</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {reportData.porMecanico.slice(0,10).map(m => (
                                    <TableRow key={m.nome}><TableCell>{m.nome}</TableCell><TableCell>{m.qtdTotal}</TableCell><TableCell>{m.ocorrencias}</TableCell><TableCell>{m.clientesUnicos}</TableCell></TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'><PieChart className='h-5 w-5' /> Relatório por Ação</CardTitle>
                        <CardDescription>Distribuição das ações na requisição.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader><TableRow><TableHead>Ação</TableHead><TableHead>Total Peças</TableHead><TableHead>Ocorrências</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {reportData.porAcao.map(a => (
                                    <TableRow key={a.acao}>
                                        <TableCell>
                                            <Badge variant={a.acao === 'Excluída' ? 'destructive' : 'secondary'}>{a.acao}</Badge>
                                        </TableCell>
                                        <TableCell>{a.qtdTotal}</TableCell>
                                        <TableCell>{a.ocorrencias}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
      )}

      {!isLoading && !reportData && filteredDevolucoes.length > 0 && (
         <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Gere um Relatório</h2>
            <p className="text-muted-foreground mt-2">
              Clique em &quot;Gerar Relatórios&quot; para visualizar as análises do período selecionado.
            </p>
         </div>
      )}
      
       {!isLoading && allDevolucoes.length === 0 && (
         <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Undo className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Nenhuma Devolução Registrada</h2>
            <p className="text-muted-foreground mt-2">
              Cadastre sua primeira devolução para poder visualizar os relatórios.
            </p>
         </div>
      )}

    </div>
  );
}
