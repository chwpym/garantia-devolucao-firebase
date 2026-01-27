
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import type { ReturnStatus, Product, ItemDevolucao } from '@/lib/types';
import { Combobox } from '../ui/combobox';
import { DatePicker } from '../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import { parseISO, isSameDay } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { QuickRegisterDialog } from '../quick-register-dialog';
import { useAppStore } from '@/store/app-store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Label } from '../ui/label';
import ComboboxSearch from '../combobox-search';

const itemDevolucaoSchema = z.object({
    id: z.number().optional(),
    codigoPeca: z.string().optional(),
    descricaoPeca: z.string().optional(),
    quantidade: z.coerce.number().min(1, 'Quantidade deve ser no mínimo 1').optional(),
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

interface DevolucaoRegisterSectionProps {
    editingId: number | null;
    onSave: () => void;
}

const defaultFormValues: DevolucaoFormValues = {
    cliente: '',
    mecanico: '',
    requisicaoVenda: '',
    acaoRequisicao: 'Alterada', // Default value
    dataDevolucao: new Date(),
    dataVenda: new Date(),
    observacaoGeral: '',
    itens: [{ codigoPeca: '', descricaoPeca: '', quantidade: 1 }],
};

type DevolucaoComItem = Awaited<ReturnType<typeof db.getAllDevolucoes>>[0] & { item: ItemDevolucao };

function RecentDevolutionsList() {
    const [recentItems, setRecentItems] = useState<DevolucaoComItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterDate, setFilterDate] = useState<Date | undefined>(new Date());

    const fetchRecentItems = useCallback(async () => {
        setIsLoading(true);
        const allDevolucoes = await db.getAllDevolucoes();
        const itemsComDevolucao: DevolucaoComItem[] = [];

        allDevolucoes.forEach(devolucao => {
            devolucao.itens.forEach(item => {
                itemsComDevolucao.push({
                    ...devolucao,
                    item: item
                });
            });
        });

        setRecentItems(itemsComDevolucao.sort((a, b) => parseISO(b.dataDevolucao).getTime() - parseISO(a.dataDevolucao).getTime()));
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchRecentItems();
        window.addEventListener('datachanged', fetchRecentItems);
        return () => window.removeEventListener('datachanged', fetchRecentItems);
    }, [fetchRecentItems]);

    const filteredItems = useMemo(() => {
        if (!filterDate) return recentItems;
        return recentItems.filter(d => isSameDay(parseISO(d.dataDevolucao), filterDate));
    }, [recentItems, filterDate]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Devoluções do Dia</CardTitle>
                <CardDescription>Lista das devoluções registradas no dia selecionado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <Label htmlFor="filter-date" className="shrink-0">Filtro por</Label>
                    <DatePicker date={filterDate} setDate={setFilterDate} />
                </div>
                {isLoading ? (
                    <Skeleton className="h-48 w-full" />
                ) : (
                    <div className="border rounded-md max-h-[400px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente/Peça</TableHead>
                                    <TableHead className="text-right">Qtd.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((devolucao, index) => (
                                        <TableRow key={`${devolucao.id}-${devolucao.item.id}-${index}`}>
                                            <TableCell>
                                                <div className="font-medium">{devolucao.cliente}</div>
                                                <div className="text-sm text-muted-foreground">{devolucao.item.descricaoPeca}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">{devolucao.item.quantidade}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            Nenhuma devolução encontrada para esta data.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}



export default function DevolucaoRegisterSection({ editingId, onSave }: DevolucaoRegisterSectionProps) {
    const { persons, isDataLoaded, reloadData } = useAppStore();
    const [isProductModalOpen, setProductModalOpen] = useState(false);
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
    const [shouldExit, setShouldExit] = useState(true);

    const { toast } = useToast();
    const goBack = useAppStore(state => state.goBack);

    const form = useForm<DevolucaoFormValues>({
        resolver: zodResolver(devolucaoSchema),
        defaultValues: defaultFormValues,
    });

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: 'itens',
    });

    const loadEditingData = useCallback(async (id: number) => {
        const data = await db.getDevolucaoById(id);
        if (data) {
            form.reset({
                ...data,
                dataVenda: data.dataVenda ? parseISO(data.dataVenda) : new Date(),
                dataDevolucao: data.dataDevolucao ? parseISO(data.dataDevolucao) : new Date(),
            });
            if (data.itens) {
                replace(data.itens.map(item => ({ ...item, id: item.id || undefined })));
            }
        } else {
            toast({
                title: 'Erro',
                description: 'Não foi possível encontrar a devolução para edição.',
                variant: 'destructive',
            });
            onSave(); // Volta para a lista
        }
    }, [form, onSave, replace, toast]);


    useEffect(() => {
        if (isDataLoaded && editingId) {
            loadEditingData(editingId);
        }
    }, [editingId, isDataLoaded, loadEditingData]);

    const onSubmit = async (data: DevolucaoFormValues) => {
        try {
            const currentDevolucao = editingId ? await db.getDevolucaoById(editingId) : null;
            const currentStatus: ReturnStatus = currentDevolucao?.status || 'Recebido';

            const devolucaoBaseData = {
                cliente: data.cliente,
                mecanico: data.mecanico,
                requisicaoVenda: data.requisicaoVenda,
                acaoRequisicao: data.acaoRequisicao,
                dataVenda: data.dataVenda.toISOString(),
                dataDevolucao: data.dataDevolucao.toISOString(),
                status: currentStatus,
                observacaoGeral: data.observacaoGeral
            };

            if (editingId) {
                const devolucaoData = {
                    ...devolucaoBaseData,
                    id: editingId,
                };
                const itensData = data.itens.map(item => ({
                    id: item.id,
                    codigoPeca: item.codigoPeca || '',
                    descricaoPeca: item.descricaoPeca || '',
                    quantidade: item.quantidade || 1,
                }));
                await db.updateDevolucao(devolucaoData, itensData);
                if (shouldExit) {
                    onSave();
                } else {
                    // Mantém dados comuns (cliente, mecânico, data, requisição) mas limpa os itens
                    form.setValue('itens', [{ codigoPeca: '', descricaoPeca: '', quantidade: 1 }]);
                    toast({
                        title: 'Tudo pronto!',
                        description: 'O cadastro foi atualizado e mantido para novas peças.'
                    });
                }

            } else {
                const devolucaoData = {
                    ...devolucaoBaseData
                };
                const itensData = data.itens.map(item => ({
                    codigoPeca: item.codigoPeca || '',
                    descricaoPeca: item.descricaoPeca || '',
                    quantidade: item.quantidade || 1,
                }));
                await db.addDevolucao(devolucaoData, itensData);
                if (shouldExit) {
                    onSave();
                } else {
                    // Limpa apenas os itens para agilizar novo registro do mesmo cliente/requisicao
                    form.setValue('itens', [{ codigoPeca: '', descricaoPeca: '', quantidade: 1 }]);
                    window.dispatchEvent(new CustomEvent('datachanged'));
                    toast({
                        title: 'Cadastrado!',
                        description: 'A devolução foi salva. Itens limpos para novo registro.'
                    });
                }
            }
        } catch (error) {
            console.error('Failed to save devolution:', error);
            toast({
                title: 'Erro ao Salvar',
                description: 'Não foi possível salvar a devolução.',
                variant: 'destructive'
            });
        }
    };

    const handleCancel = () => {
        goBack(); // Usa a ação do store para voltar
    }

    const handleProductSaved = (newProduct: Product) => {
        if (activeItemIndex !== null) {
            form.setValue(`itens.${activeItemIndex}.codigoPeca`, newProduct.codigo);
            form.setValue(`itens.${activeItemIndex}.descricaoPeca`, newProduct.descricao);
        }
        setProductModalOpen(false);
        setActiveItemIndex(null);
    };

    const handleProductSelect = (product: Product, index: number) => {
        form.setValue(`itens.${index}.codigoPeca`, product.codigo);
        form.setValue(`itens.${index}.descricaoPeca`, product.descricao);
    };

    const clients = useMemo(() => persons.filter(p => p.tipo === 'Cliente' || p.tipo === 'Ambos'), [persons]);
    const mechanics = useMemo(() => persons.filter(p => p.tipo === 'Mecânico' || p.tipo === 'Ambos'), [persons]);
    const clientOptions = useMemo(() => clients.map(c => ({ value: c.nome, label: c.nome })), [clients]);
    const mechanicOptions = useMemo(() => mechanics.map(m => ({ value: m.nome, label: m.nome })), [mechanics]);

    if (!isDataLoaded) {
        return <Skeleton className="h-[700px] w-full" />;
    }

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{editingId ? 'Editar Devolução' : 'Cadastro de Devolução'}</CardTitle>
                            <CardDescription>
                                {editingId ? 'Altere os dados da devolução abaixo.' : 'Registre uma nova devolução com um ou mais itens.'}
                            </CardDescription>
                        </CardHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <CardContent className='space-y-8'>

                                    {/* Items */}
                                    <div className='space-y-4'>
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-medium text-foreground">Peças Devolvidas</h3>
                                            <Button type="button" size="sm" variant="default" onClick={() => append({ codigoPeca: '', descricaoPeca: '', quantidade: 1 })}>
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
                                                                <FormItem className="md:col-span-3">
                                                                    <FormLabel>Código <span className='text-destructive'>*</span></FormLabel>
                                                                    <FormControl>
                                                                        <ComboboxSearch
                                                                            value={field.value}
                                                                            onProductSelect={(product) => handleProductSelect(product, index)}
                                                                            onInputChange={(value) => field.onChange(value)}
                                                                            onAddNew={() => {
                                                                                setActiveItemIndex(index);
                                                                                setProductModalOpen(true);
                                                                            }}
                                                                            placeholder="Código da peça"
                                                                            searchPlaceholder="Buscar produto..."
                                                                            addEntityLabel="Cadastrar Novo Produto"
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            name={`itens.${index}.descricaoPeca`}
                                                            control={form.control}
                                                            render={({ field }) => (
                                                                <FormItem className="md:col-span-7"><FormLabel>Descrição <span className='text-destructive'>*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            name={`itens.${index}.quantidade`}
                                                            control={form.control}
                                                            render={({ field }) => (
                                                                <FormItem className="md:col-span-2"><FormLabel>Qtd. <span className='text-destructive'>*</span></FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

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

                                </CardContent>
                                <CardFooter className="flex justify-between items-center gap-2">
                                    <Button type="button" variant="ghost" onClick={handleCancel} disabled={form.formState.isSubmitting}>
                                        Cancelar
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button
                                            type="submit"
                                            variant="outline"
                                            disabled={form.formState.isSubmitting}
                                            onClick={() => setShouldExit(false)}
                                        >
                                            {form.formState.isSubmitting ? "..." : "Salvar e Continuar"}
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={form.formState.isSubmitting}
                                            onClick={() => setShouldExit(true)}
                                        >
                                            {form.formState.isSubmitting ? "..." : (editingId ? 'Atualizar e Sair' : 'Salvar e Sair')}
                                        </Button>
                                    </div>
                                </CardFooter>
                            </form>
                        </Form>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <RecentDevolutionsList />
                </div>
            </div>

            <QuickRegisterDialog
                open={isProductModalOpen}
                onOpenChange={setProductModalOpen}
                type="product"
                onSuccess={handleProductSaved}
            />
        </>
    );
}
