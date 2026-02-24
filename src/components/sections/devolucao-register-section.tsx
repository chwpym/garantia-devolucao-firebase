
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Search, Clock, CalendarIcon } from 'lucide-react';
import type { ReturnStatus, Product, ItemDevolucao, Person } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { parseISO, isSameDay } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QuickRegisterDialog } from '@/components/quick-register-dialog';
import { useAppStore } from '@/store/app-store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import ComboboxSearch from '@/components/combobox-search';

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
    acaoRequisicao: z.string().min(1, 'Selecione uma ação para a requisição'),
    dataVenda: z.date({ required_error: 'Data da venda é obrigatória' }),
    dataDevolucao: z.date({ required_error: 'Data da devolução é obrigatória' }),
    status: z.string().optional(),
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
    acaoRequisicao: '', // Default value
    dataDevolucao: new Date(),
    dataVenda: new Date(),
    status: '', // Valor padrão
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
        <Card className="h-full border-muted/40 shadow-sm flex flex-col">
            <CardHeader className="py-4 px-4 border-b bg-muted/5 space-y-3">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Devoluções</CardTitle>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                        <CalendarIcon className="h-3 w-3" />
                        Filtro por data
                    </label>
                    <DatePicker date={filterDate} setDate={setFilterDate} />
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-muted">
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted/10 sticky top-0 z-10">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-[10px] h-8 px-2">Cliente/Peça</TableHead>
                                <TableHead className="text-[10px] h-8 px-2 text-right">Qtd.</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.length > 0 ? (
                                filteredItems.map((devolucao, index) => (
                                    <TableRow key={`${devolucao.id}-${devolucao.item.id}-${index}`} className="group transition-colors h-14">
                                        <TableCell className="px-2 py-2">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="font-bold text-xs truncate max-w-[140px]">{devolucao.cliente}</div>
                                                <div className="text-[10px] text-muted-foreground truncate max-w-[140px] italic">{devolucao.item.descricaoPeca}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-2 py-0 text-right font-mono font-bold text-primary">
                                            {devolucao.item.quantidade}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="py-8 text-center text-muted-foreground italic text-xs">
                                        Nenhum registro nesta data.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}



export default function DevolucaoRegisterSection({ editingId, onSave }: DevolucaoRegisterSectionProps) {
    const { persons, isDataLoaded, reloadData, statuses } = useAppStore();
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


    const fetchProductInfo = async (index: number, codigo: string) => {
        if (!codigo) return;
        try {
            const product = await db.getProductByCode(codigo);
            if (product) {
                form.setValue(`itens.${index}.descricaoPeca`, product.descricao);
            }
        } catch (error) {
            console.error('Failed to fetch product info:', error);
        }
    };

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

    const clients = useMemo(() => {
        const filtered = persons.filter(p => p.tipo === 'Cliente' || p.tipo === 'Ambos');
        const nameCounts = new Map<string, number>();
        filtered.forEach(p => nameCounts.set(p.nome, (nameCounts.get(p.nome) || 0) + 1));

        return filtered.map(p => {
            const hasCollision = (nameCounts.get(p.nome) || 0) > 1;
            const docFragment = p.cpfCnpj ? ` (${p.cpfCnpj.slice(-4)})` : '';
            const displayName = hasCollision ? `${p.nome}${docFragment}` : p.nome;
            return { ...p, displayName };
        });
    }, [persons]);

    const mechanics = useMemo(() => {
        const filtered = persons.filter(p => p.tipo === 'Mecânico' || p.tipo === 'Ambos');
        const nameCounts = new Map<string, number>();
        filtered.forEach(p => nameCounts.set(p.nome, (nameCounts.get(p.nome) || 0) + 1));

        return filtered.map(p => {
            const hasCollision = (nameCounts.get(p.nome) || 0) > 1;
            const docFragment = p.cpfCnpj ? ` (${p.cpfCnpj.slice(-4)})` : '';
            const displayName = hasCollision ? `${p.nome}${docFragment}` : p.nome;
            return { ...p, displayName };
        });
    }, [persons]);

    const clientOptions = useMemo(() => clients.map(c => ({ value: c.displayName, label: c.displayName, key: c.id })), [clients]);
    const mechanicOptions = useMemo(() => mechanics.map(m => ({ value: m.displayName, label: m.displayName, key: m.id })), [mechanics]);

    // Dynamic statuses for Devolução
    const returnStatuses = useMemo(() => {
        const defaults = ['Recebido', 'Aguardando Peças', 'Finalizada', 'Cancelada'];
        const dynamics = statuses
            .filter(s => s.aplicavelEm.includes('devolucao'))
            .map(s => s.nome);
        return Array.from(new Set([...defaults, ...dynamics]));
    }, [statuses]);

    // Dynamic statuses for Ação Requisição
    const acaoStatuses = useMemo(() => {
        const defaults = ['Alterada', 'Excluída'];
        const dynamics = statuses
            .filter(s => s.aplicavelEm.includes('acaoRequisicao'))
            .map(s => s.nome);
        return Array.from(new Set([...defaults, ...dynamics]));
    }, [statuses]);

    if (!isDataLoaded) {
        return <Skeleton className="h-[700px] w-full" />;
    }

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-full lg:h-[calc(100vh-140px)] overflow-hidden">
            <div className="lg:col-span-3 h-full overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted">
                <Card className='border-muted/40 shadow-sm'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader className='pb-4 border-b bg-muted/5'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <CardTitle className='text-xl flex items-center gap-2'>
                                        <div className='h-8 w-1 bg-primary rounded-full' />
                                        Cadastro de Devolução
                                    </CardTitle>
                                    <CardDescription>Registre uma nova devolução com um ou mais itens.</CardDescription>
                                </div>
                                {editingId && (
                                    <Badge variant="outline" className="h-6 gap-1 font-mono">
                                        Editando #{editingId}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className='pt-6 space-y-6'>
                            <div className='bg-muted/5 border rounded-lg p-4 space-y-4'>
                                <div className='flex items-center justify-between'>
                                    <h3 className='text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                                        Peças Devolvidas
                                    </h3>
                                    <Button type="button" size="sm" onClick={() => append({ codigoPeca: '', descricaoPeca: '', quantidade: 1 })} className='gap-2 shadow-sm'>
                                        <PlusCircle className="h-4 w-4" />
                                        Adicionar Peça
                                    </Button>
                                </div>

                                {fields.map((item, index) => (
                                    <Card key={item.id} className='relative bg-background/50 border-muted/30'>
                                        <CardHeader className='p-3 border-b flex flex-row items-center justify-between'>
                                            <span className='text-xs font-bold text-primary italic'>Peça #{index + 1}</span>
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => remove(index)}
                                                    className='h-8 w-8 text-destructive'
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </CardHeader>
                                        <CardContent className='p-4 grid grid-cols-1 md:grid-cols-12 gap-4'>
                                            <div className='md:col-span-3'>
                                                <FormField
                                                    control={form.control}
                                                    name={`itens.${index}.codigoPeca`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className='text-xs'>Código <span className='text-destructive'>*</span></FormLabel>
                                                            <FormControl>
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        placeholder="Aguardando..."
                                                                        {...field}
                                                                        onBlur={(e) => fetchProductInfo(index, e.target.value)}
                                                                        className='h-9 transition-all focus:ring-1'
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="h-9 w-9 shrink-0"
                                                                        onClick={() => {
                                                                            setActiveItemIndex(index);
                                                                            setProductModalOpen(true);
                                                                        }}
                                                                    >
                                                                        <Search className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage className='text-[10px]' />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className='md:col-span-7'>
                                                <FormField
                                                    control={form.control}
                                                    name={`itens.${index}.descricaoPeca`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className='text-xs'>Descrição <span className='text-destructive'>*</span></FormLabel>
                                                            <FormControl><Input placeholder="Descrição do produto" {...field} className='h-9' /></FormControl>
                                                            <FormMessage className='text-[10px]' />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className='md:col-span-2'>
                                                <FormField
                                                    control={form.control}
                                                    name={`itens.${index}.quantidade`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className='text-xs'>Qtd. <span className='text-destructive'>*</span></FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    {...field}
                                                                    onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                                                                    className='h-9'
                                                                />
                                                            </FormControl>
                                                            <FormMessage className='text-[10px]' />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <FormField
                                    control={form.control}
                                    name="cliente"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cliente <span className='text-destructive'>*</span></FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl><SelectTrigger className='h-10'><SelectValue placeholder="Selecione um cliente" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {clients.map(p => (
                                                        <SelectItem key={`${p.id}-${p.displayName}`} value={p.displayName}>{p.displayName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="mecanico"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mecânico (opcional)</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl><SelectTrigger className='h-10'><SelectValue placeholder="Selecione um mecânico" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {mechanics.map(p => (
                                                        <SelectItem key={`${p.id}-${p.displayName}`} value={p.displayName}>{p.displayName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="requisicaoVenda"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Requisição de Venda <span className='text-destructive'>*</span></FormLabel>
                                            <FormControl><Input placeholder="Número da requisição" {...field} className='h-10' /></FormControl>
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
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl><SelectTrigger className='h-10'><SelectValue placeholder="SELECIONE O STATUS" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {acaoStatuses.map(status => (
                                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                                    ))}
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
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem className='md:col-span-2'>
                                            <FormLabel>Status da Devolução <span className='text-destructive'>*</span></FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl><SelectTrigger className='h-10'><SelectValue placeholder="SELECIONE O STATUS" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {returnStatuses.map(status => (
                                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
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
                                        <FormControl><Textarea placeholder="Adicione uma observação geral sobre a devolução..." {...field} className='min-h-[100px] resize-none' /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </CardContent>
                        <CardFooter className="flex justify-between items-center gap-2 py-4 border-t bg-muted/5">
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
            <div className="lg:col-span-1 h-full overflow-hidden">
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
