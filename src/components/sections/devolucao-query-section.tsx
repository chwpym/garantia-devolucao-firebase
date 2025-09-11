'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Devolucao, ItemDevolucao } from '@/lib/types';
import * as db from '@/lib/db';
import { format, parseISO } from 'date-fns';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type DevolucaoComItens = Devolucao & { itens: ItemDevolucao[] };
type DevolucaoFlat = Omit<DevolucaoComItens, 'itens'> & ItemDevolucao;

export default function DevolucaoQuerySection() {
  const [devolucoes, setDevolucoes] = useState<DevolucaoFlat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await db.initDB();
      const data = await db.getAllDevolucoes();
      
      // Flatten the data: one row per item
      const flatData = data.flatMap(devolucao => 
        devolucao.itens.map(item => ({
            ...devolucao,
            ...item,
            id: devolucao.id, // Parent ID for the main record
            itemId: item.id, // Child ID for the item
        }))
      );
      
      setDevolucoes(flatData.sort((a,b) => parseISO(b.dataDevolucao).getTime() - parseISO(a.dataDevolucao).getTime()));
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
    window.addEventListener('datachanged', loadData);
    return () => window.removeEventListener('datachanged', loadData);
  }, [loadData]);


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
                   Cada linha representa um item dentro de uma devolução.
                </CardDescription>
            </CardHeader>
            <CardContent>
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
                        {devolucoes.length > 0 ? (
                            devolucoes.map(item => (
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
                                    Nenhuma devolução encontrada.
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
