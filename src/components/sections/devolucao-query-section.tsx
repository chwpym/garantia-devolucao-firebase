'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Devolucao, ItemDevolucao } from '@/lib/types';
import * as db from '@/lib/db';
import { format, parseISO, addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';


import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '../ui/input';
import { DatePickerWithRange } from '../ui/date-range-picker';

type DevolucaoComItens = Devolucao & { itens: ItemDevolucao[] };
type DevolucaoFlat = Omit<Devolucao, 'itens' | 'id'> & ItemDevolucao & { id: number, itemId: number };

const mockData: DevolucaoFlat[] = [
    {
        id: 1152,
        itemId: 1,
        codigoPeca: "18940",
        descricaoPeca: "MANGUEIRA TUBO BOMBA AGUA JAHU 219450",
        quantidade: 1,
        cliente: "RETIFICA CANAA",
        mecanico: "RETIFICA CANAA",
        requisicaoVenda: "120295",
        acaoRequisicao: "Alterada", // Changed from "Devolução"
        dataVenda: "2025-09-08T00:00:00.000Z",
        dataDevolucao: "2025-09-11T00:00:00.000Z",
        status: "Recebido",
        observacaoGeral: "mesmo estado",
    },
    {
        id: 1153,
        itemId: 1,
        codigoPeca: "20990",
        descricaoPeca: "FILTRO OLEO MAHLE OC66",
        quantidade: 1,
        cliente: "GOMES ESCAPAMENTO",
        mecanico: "GOMES ESCAPAMENTO",
        requisicaoVenda: "120378",
        acaoRequisicao: "Alterada", // Changed from "Devolução"
        dataVenda: "2025-09-09T00:00:00.000Z",
        dataDevolucao: "2025-09-11T00:00:00.00Z",
        status: "Recebido",
        observacaoGeral: "",
    },
    {
        id: 1154,
        itemId: 1,
        codigoPeca: "21463",
        descricaoPeca: "SENSOR TEMPERATURA AGUA NTK CTN2A001",
        quantidade: 1,
        cliente: "AUTO PADRAO CENTRO AUTOMOTIVO",
        mecanico: "AUTO PADRAO CENTRO AUTOMOTIVO",
        requisicaoVenda: "120320",
        acaoRequisicao: "Alterada", // Changed from "Devolução"
        dataVenda: "2025-09-08T00:00:00.000Z",
        dataDevolucao: "2025-09-11T00:00:00.000Z",
        status: "Recebido",
        observacaoGeral: "PARECE QUE FOI USADO PARA TESTAR",
    },
    {
        id: 1155,
        itemId: 1,
        codigoPeca: "21276",
        descricaoPeca: "ROLAMENTO RODA DIANTEIRA SCHADEK 50001",
        quantidade: 1,
        cliente: "LEONARDO VEICULOS",
        mecanico: "FER CAR (NO)",
        requisicaoVenda: "120401",
        acaoRequisicao: "Alterada", // Changed from "Devolução"
        dataVenda: "2025-09-10T00:00:00.000Z",
        dataDevolucao: "2025-09-11T00:00:00.000Z",
        status: "Recebido",
        observacaoGeral: "MESMO ESTADO",
    },
    {
        id: 1156,
        itemId: 1,
        codigoPeca: "4095",
        descricaoPeca: "RESERVATORIO RADIADOR GONEL G1254",
        quantidade: 1,
        cliente: "CHEVROCAR AUTO MECANICA",
        mecanico: "CHEVROCAR AUTO MECANICA",
        requisicaoVenda: "120393",
        acaoRequisicao: "Alterada", // Changed from "Devolução"
        dataVenda: "2025-09-09T00:00:00.000Z",
        dataDevolucao: "2025-09-11T00:00:00.000Z",
        status: "Recebido",
        observacaoGeral: "MESMO ESTADO",
    },
    {
        id: 1157,
        itemId: 1,
        codigoPeca: "15650",
        descricaoPeca: "CUBO RODA DIANTEIRA HIPPER FREIOS HFCD01",
        quantidade: 1,
        cliente: "LEONARDO VEICULOS",
        mecanico: "FER CAR (NO)",
        requisicaoVenda: "120401",
        acaoRequisicao: "Alterada", // Changed from "Devolução"
        dataVenda: "2025-09-10T00:00:00.000Z",
        dataDevolucao: "2025-09-11T00:00:00.000Z",
        status: "Recebido",
        observacaoGeral: "MESMO ESTADO",
    },
    {
        id: 1158,
        itemId: 1,
        codigoPeca: "20249",
        descricaoPeca: "CABO EMBREAGEM EFRARI FNM089A",
        quantidade: 1,
        cliente: "WELLINGTON LUIZ CARDOSO FORTE- ME ( GRANDY )",
        mecanico: "WELLINGTON LUIZ CARDOSO FORTE- ME ( GRANDY )",
        requisicaoVenda: "120284",
        acaoRequisicao: "Alterada", // Changed from "Devolução"
        dataVenda: "2025-09-08T00:00:00.000Z",
        dataDevolucao: "2025-09-11T00:00:00.000Z",
        status: "Recebido",
        observacaoGeral: "embalagem aberta",
    },
    {
        id: 1159,
        itemId: 1,
        codigoPeca: "19702",
        descricaoPeca: "ARTICULAÇAO AXIAL BORTEC BA8363",
        quantidade: 1,
        cliente: "GS AUTO MECANICA",
        mecanico: "GS AUTO MECANICA",
        requisicaoVenda: "120348",
        acaoRequisicao: "Alterada", // Changed from "Devolução"
        dataVenda: "2025-09-09T00:00:00.000Z",
        dataDevolucao: "2025-09-11T00:00:00.000Z",
        status: "Recebido",
        observacaoGeral: "estava trocado dentro da embalagem, estava com peça automix AX11103H,rosca grossa",
    },
    {
        id: 1160,
        itemId: 1,
        codigoPeca: "9388",
        descricaoPeca: "VELA IGNIÇAO NGK BP5HS",
        quantidade: 1,
        cliente: "GS AUTO MECANICA",
        mecanico: "GS AUTO MECANICA",
        requisicaoVenda: "120167",
        acaoRequisicao: "Alterada", // Changed from "Devolução"
        dataVenda: "2025-09-04T00:00:00.000Z",
        dataDevolucao: "2025-09-11T00:00:00.000Z",
        status: "Recebido",
        observacaoGeral: "novo",
    },
    {
        id: 1161,
        itemId: 1,
        codigoPeca: "22248",
        descricaoPeca: "CORREIA POLI V GATES 6PK1375",
        quantidade: 1,
        cliente: "GS AUTO MECANICA",
        mecanico: "GS AUTO MECANICA",
        requisicaoVenda: "120382",
        acaoRequisicao: "Excluída",
        dataVenda: "2025-09-09T00:00:00.000Z",
        dataDevolucao: "2025-09-11T00:00:00.000Z",
        status: "Recebido",
        observacaoGeral: "novo",
    },
    {
        id: 1162,
        itemId: 1,
        codigoPeca: "1406",
        descricaoPeca: "PIVO SUSPENSAO LD / LE NAKATA N6058",
        quantidade: 1,
        cliente: "GS AUTO MECANICA",
        mecanico: "GS AUTO MECANICA",
        requisicaoVenda: "120386",
        acaoRequisicao: "Excluída",
        dataVenda: "2025-09-09T00:00:00.000Z",
        dataDevolucao: "2025-09-11T00:00:00.000Z",
        status: "Recebido",
        observacaoGeral: "novo",
    }
];

export default function DevolucaoQuerySection() {
  const [devolucoes, setDevolucoes] = useState<DevolucaoFlat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await db.initDB();
      // const data = await db.getAllDevolucoes();
      const data: DevolucaoComItens[] = []; // Desativado para usar mock
      
      // Flatten the data: one row per item
      const flatData = data.flatMap(devolucao => 
        devolucao.itens.map(item => ({
            ...devolucao,
            ...item,
            id: devolucao.id!, // Parent ID for the main record
            itemId: item.id!, // Child ID for the item
        }))
      );

      // Usando mockData em vez de dados do DB
      setDevolucoes(mockData.sort((a,b) => parseISO(b.dataDevolucao).getTime() - parseISO(a.dataDevolucao).getTime()));
      
    } catch (error) {
      console.error('Failed to load devolutions:', error);
      toast({
        title: 'Erro ao Carregar',
        description: 'Não foi possível carregar as devoluções.',
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
    // window.addEventListener('datachanged', loadData);
    // return () => window.removeEventListener('datachanged', loadData);
  }, [loadData]);
  
  const filteredDevolucoes = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    
    return devolucoes.filter(item => {
      // Date filter
      const { from, to } = dateRange || {};
      if (from && item.dataDevolucao) {
        if (parseISO(item.dataDevolucao) < from) return false;
      }
      if (to && item.dataDevolucao) {
        const toDate = addDays(to, 1);
        if (parseISO(item.dataDevolucao) >= toDate) return false;
      }
      
      // Search term filter
      if (!lowercasedTerm) {
        return true;
      }
      return (
        item.cliente?.toLowerCase().includes(lowercasedTerm) ||
        item.mecanico?.toLowerCase().includes(lowercasedTerm) ||
        item.requisicaoVenda?.toLowerCase().includes(lowercasedTerm) ||
        item.codigoPeca?.toLowerCase().includes(lowercasedTerm) ||
        item.descricaoPeca?.toLowerCase().includes(lowercasedTerm) ||
        item.status?.toLowerCase().includes(lowercasedTerm)
      );
    });
  }, [searchTerm, devolucoes, dateRange]);


  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className='space-y-8'>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Consulta de Devoluções</h1>
            <p className="text-lg text-muted-foreground">
                Visualize, filtre e gerencie as devoluções registradas.
            </p>
        </div>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Devoluções Registradas</CardTitle>
                <CardDescription>
                   Cada linha representa um item dentro de uma devolução. Use os filtros para refinar sua busca.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por cliente, peça, requisição, etc..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10"
                        />
                    </div>
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                </div>
                <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data Dev.</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Requisição</TableHead>
                            <TableHead>Código Peça</TableHead>
                            <TableHead>Descrição Peça</TableHead>
                            <TableHead>Qtd.</TableHead>
                            <TableHead>Ação Req.</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDevolucoes.length > 0 ? (
                            filteredDevolucoes.map(item => (
                                <TableRow key={`${item.id}-${item.itemId}`}>
                                    <TableCell>{format(parseISO(item.dataDevolucao), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>{item.cliente}</TableCell>
                                    <TableCell>{item.requisicaoVenda}</TableCell>
                                    <TableCell className="font-medium">{item.codigoPeca}</TableCell>
                                    <TableCell>{item.descricaoPeca}</TableCell>
                                    <TableCell>{item.quantidade}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.acaoRequisicao === 'Excluída' ? 'destructive' : 'secondary'}>
                                            {item.acaoRequisicao}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    Nenhuma devolução encontrada para os filtros selecionados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

    