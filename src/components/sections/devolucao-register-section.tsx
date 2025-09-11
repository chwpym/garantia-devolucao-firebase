'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { Person, Devolucao, ItemDevolucao } from '@/lib/types';
import { Combobox } from '../ui/combobox';
import { DatePicker } from '../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';

const itemDevolucaoSchema = z.object({
  codigoPeca: z.string().min(1, 'Código é obrigatório'),
  descricaoPeca: z.string().min(1, 'Descrição é obrigatória'),
  quantidade: z.coerce.number().min(1, 'Quantidade deve ser no mínimo 1'),
  acao: z.enum(['Troca', 'Reembolso', 'Reparo', 'Descarte', 'Análise'], { required_error: 'Selecione uma ação' }),
});

const devolucaoSchema = z.object({
  cliente: z.string().min(1, 'Cliente é obrigatório'),
  mecanico: z.string().optional(),
  requisicaoVenda: z.string().min(1, 'Requisição é obrigatória'),
  acaoRequisicao: z.enum(['Alterada', 'Excluída'], { required_error: 'Selecione uma ação para a requisição' }),
  dataVenda: z.date({ required_error: 'Data da venda é obrigatória' }),
  dataDevolucao: z.date({ required_error: 'Data da devolução é obrigatória' }),
  observacaoGeral: z.string().optional(),
  itens: z.array(itemDevolucaoSchema).min(1, 'Adicione pelo menos uma peça'),
});

type DevolucaoFormValues = z.infer<typeof devolucaoSchema>;

export default function DevolucaoRegisterSection() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [persons, setPersons] = useState<Person[]>([]);
  const { toast } = useToast();

  const form = useForm<DevolucaoFormValues>({
    resolver: zodResolver(devolucaoSchema),
    defaultValues: {
      cliente: '',
      mecanico: '',
      requisicaoVenda: '',
      dataDevolucao: new Date(),
      observacaoGeral: '',
      itens: [{ codigoPeca: '', descricaoPeca: '', quantidade: 1, acao: 'Troca' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'itens',
  });

  const loadDropdownData = async () => {
    const allPersons = await db.getAllPersons();
    setPersons(allPersons.sort((a, b) => a.nome.localeCompare(b.nome)));
  }

  useEffect(() => {
    async function initializeDB() {
      try {
        await db.initDB();
        setIsDbReady(true);
        await loadDropdownData();
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

    const handleDataChanged = () => loadDropdownData();
    window.addEventListener('datachanged', handleDataChanged);
    return () => window.removeEventListener('datachanged', handleDataChanged);
  }, [toast]);
  
  const onSubmit = async (data: DevolucaoFormValues) => {
    try {
        const devolucaoData: Omit<Devolucao, 'id'> = {
            cliente: data.cliente,
            mecanico: data.mecanico,
            requisicaoVenda: data.requisicaoVenda,
            acaoRequisicao: data.acaoRequisicao,
            dataVenda: data.dataVenda.toISOString(),
            dataDevolucao: data.dataDevolucao.toISOString(),
            status: 'Recebido', // Default status
            observacaoGeral: data.observacaoGeral
        };
        const itensData = data.itens.map(item => ({
            codigoPeca: item.codigoPeca,
            descricaoPeca: item.descricaoPeca,
            quantidade: item.quantidade,
            acao: item.acao,
        }));
        
        await db.addDevolucao(devolucaoData, itensData);
        
        toast({
            title: 'Sucesso!',
            description: 'Devolução registrada com sucesso.'
        });
        form.reset();
        form.setValue('itens', [{ codigoPeca: '', descricaoPeca: '', quantidade: 1, acao: 'Troca' }]);
        window.dispatchEvent(new CustomEvent('datachanged'));

    } catch (error) {
        console.error('Failed to save devolution:', error);
        toast({
            title: 'Erro ao Salvar',
            description: 'Não foi possível registrar a devolução.',
            variant: 'destructive'
        });
    }
  };

  const clients = persons.filter(p => p.tipo === 'Cliente' || p.tipo === 'Ambos');
  const mechanics = persons.filter(p => p.tipo === 'Mecânico' || p.tipo === 'Ambos');
  const clientOptions = clients.map(c => ({ value: c.nome, label: c.nome }));
  const mechanicOptions = mechanics.map(m => ({ value: m.nome, label: m.nome }));

  if (!isDbReady) {
    return <Skeleton className="h-[700px] w-full" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
            <CardTitle>Cadastro de Devolução</CardTitle>
            <CardDescription>
                Registre uma nova devolução com um ou mais itens.
            </CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className='space-y-8'>
                    {/* General Info */}
                    <div className='grid md:grid-cols-2 gap-4'>
                        <FormField
                            control={form.control}
                            name="cliente"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Cliente <span className='text-destructive'>*</span></FormLabel>
                                    <Combobox
                                        options={clientOptions}
                                        value={field.value ?? ''}
                                        onChange={field.onChange}
                                        placeholder="Selecione um cliente"
                                        searchPlaceholder="Buscar cliente..."
                                        notFoundMessage="Nenhum cliente encontrado."
                                        className="w-full"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mecanico"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Mecânico <span className='text-muted-foreground text-xs'>(opcional)</span></FormLabel>
                                     <Combobox
                                        options={mechanicOptions}
                                        value={field.value ?? ''}
                                        onChange={(value) => field.onChange(value)}
                                        placeholder="Selecione um mecânico"
                                        searchPlaceholder="Buscar mecânico..."
                                        notFoundMessage="Nenhum mecânico encontrado."
                                        className="w-full"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            name="requisicaoVenda"
                            control={form.control}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Requisição de Venda <span className='text-destructive'>*</span></FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="acaoRequisicao"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ação na Requisição <span className='text-destructive'>*</span></FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Alterada">Alterada</SelectItem>
                                            <SelectItem value="Excluída">Excluída</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="dataVenda"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Data da Venda <span className='text-destructive'>*</span></FormLabel>
                                    <DatePicker date={field.value} setDate={field.onChange} />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="dataDevolucao"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Data da Devolução <span className='text-destructive'>*</span></FormLabel>
                                    <DatePicker date={field.value} setDate={field.onChange} />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        name="observacaoGeral"
                        control={form.control}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observação Geral</FormLabel>
                            <FormControl><Textarea placeholder="Adicione uma observação geral sobre a devolução..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    
                    {/* Items */}
                    <div className='space-y-4'>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-foreground">Peças Devolvidas</h3>
                             <Button type="button" size="sm" onClick={() => append({ codigoPeca: '', descricaoPeca: '', quantidade: 1, acao: 'Troca' })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Peça
                            </Button>
                        </div>
                         {form.formState.errors.itens?.message && <p className='text-sm font-medium text-destructive'>{form.formState.errors.itens.message}</p>}
                        
                        <div className="space-y-4">
                            {fields.map((item, index) => (
                                <div key={item.id} className="border p-4 rounded-lg relative space-y-4">
                                     <h4 className="font-semibold text-primary">Peça #{index + 1}</h4>
                                     {fields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 text-destructive hover:text-destructive"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        <FormField
                                            name={`itens.${index}.codigoPeca`}
                                            control={form.control}
                                            render={({ field }) => (
                                            <FormItem className="md:col-span-2"><FormLabel>Código <span className='text-destructive'>*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                        <FormField
                                            name={`itens.${index}.descricaoPeca`}
                                            control={form.control}
                                            render={({ field }) => (
                                            <FormItem className="md:col-span-5"><FormLabel>Descrição <span className='text-destructive'>*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                        <FormField
                                            name={`itens.${index}.quantidade`}
                                            control={form.control}
                                            render={({ field }) => (
                                            <FormItem className="md:col-span-2"><FormLabel>Qtd. <span className='text-destructive'>*</span></FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                        <Controller
                                            name={`itens.${index}.acao`}
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-3">
                                                    <FormLabel>Ação <span className='text-destructive'>*</span></FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Ação..." /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Troca">Troca</SelectItem>
                                                            <SelectItem value="Reembolso">Reembolso</SelectItem>
                                                            <SelectItem value="Reparo">Reparo</SelectItem>
                                                            <SelectItem value="Descarte">Descarte</SelectItem>
                                                            <SelectItem value="Análise">Análise</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                     <Button type="button" variant="outline" onClick={() => form.reset()}>Limpar</Button>
                     <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Salvando..." : "Salvar Devolução"}
                     </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>
    </div>
  );
}
