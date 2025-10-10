
'use client';

import { useEffect, useState, useCallback } from 'react';
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
import type { Person, Devolucao, ReturnStatus, Product } from '@/lib/types';
import { Combobox } from '../ui/combobox';
import { DatePicker } from '../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import { parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import ProductForm from '../product-form';

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

export default function DevolucaoRegisterSection({ editingId, onSave }: DevolucaoRegisterSectionProps) {
    const [isDbReady, setIsDbReady] = useState(false);
    const [persons, setPersons] = useState<Person[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isProductModalOpen, setProductModalOpen] = useState(false);
    
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);

    const { toast } = useToast();

    const form = useForm<DevolucaoFormValues>({
        resolver: zodResolver(devolucaoSchema),
        defaultValues: {
            cliente: '',
            mecanico: '',
            requisicaoVenda: '',
            dataDevolucao: new Date(),
            observacaoGeral: '',
            itens: [{ codigoPeca: '', descricaoPeca: '', quantidade: 1 }],
        },
    });

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: 'itens',
    });

    const loadDropdownData = async () => {
        const [allPersons, allProducts] = await Promise.all([
            db.getAllPersons(),
            db.getAllProducts()
        ]);
        setPersons(allPersons.sort((a, b) => a.nome.localeCompare(b.nome)));
        setProducts(allProducts);
    }

    const loadEditingData = async (id: number) => {
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
    };


    useEffect(() => {
        async function initialize() {
            try {
                await db.initDB();
                setIsDbReady(true);
                await loadDropdownData();
                if (editingId) {
                    await loadEditingData(editingId);
                }
            } catch (error) {
                console.error('Failed to initialize:', error);
                toast({
                    title: 'Erro de Banco de Dados',
                    description: 'Não foi possível carregar os dados necessários.',
                    variant: 'destructive',
                });
            }
        }
        initialize();

        const handleDataChanged = () => loadDropdownData();
        window.addEventListener('datachanged', handleDataChanged);
        return () => window.removeEventListener('datachanged', handleDataChanged);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingId, toast]);

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
                const devolucaoData: Devolucao = {
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
                toast({
                    title: 'Sucesso!',
                    description: 'Devolução atualizada com sucesso.'
                });

            } else {
                const devolucaoData: Omit<Devolucao, 'id'> = {
                    ...devolucaoBaseData
                };
                const itensData = data.itens.map(item => ({
                    codigoPeca: item.codigoPeca || '',
                    descricaoPeca: item.descricaoPeca || '',
                    quantidade: item.quantidade || 1,
                }));
                await db.addDevolucao(devolucaoData, itensData);
                toast({
                    title: 'Sucesso!',
                    description: 'Devolução registrada com sucesso.'
                });
            }

            onSave(); // Navigate back to the query list

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
        onSave(); // Simply navigates back without saving
    }

    const handleProductSaved = (newProduct: Product) => {
        setProducts(prev => [...prev, newProduct]);
        setProductModalOpen(false);
        if (activeInputIndex !== null) {
            handleProductSelect(newProduct, activeInputIndex);
        }
    };

    const handleProductSelect = (product: Product, index: number) => {
        form.setValue(`itens.${index}.codigoPeca`, product.codigo);
        form.setValue(`itens.${index}.descricaoPeca`, product.descricao);
        setActiveInputIndex(null);
    };

    const filteredProducts = productSearchQuery
        ? products.filter(p =>
            p.codigo.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
            p.descricao.toLowerCase().includes(productSearchQuery.toLowerCase())
        ).slice(0, 5)
        : [];

    const clients = persons.filter(p => p.tipo === 'Cliente' || p.tipo === 'Ambos');
    const mechanics = persons.filter(p => p.tipo === 'Mecânico' || p.tipo === 'Ambos');
    const clientOptions = clients.map(c => ({ value: c.nome, label: c.nome }));
    const mechanicOptions = mechanics.map(m => ({ value: m.nome, label: m.nome }));

    if (!isDbReady) {
        return <Skeleton className="h-[700px] w-full" />;
    }

    return (
        <>
            <div className="max-w-4xl mx-auto">
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
                                        <Button type="button" size="sm" onClick={() => append({ codigoPeca: '', descricaoPeca: '', quantidade: 1 })}>
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
                                                                <Popover
                                                                    open={activeInputIndex === index}
                                                                    onOpenChange={(isOpen) => {
                                                                        if (!isOpen) {
                                                                            setActiveInputIndex(null);
                                                                        }
                                                                    }}
                                                                >
                                                                    <PopoverTrigger asChild>
                                                                        <FormControl>
                                                                            <Input
                                                                                {...field}
                                                                                autoComplete="off"
                                                                                onFocus={() => {
                                                                                    setActiveInputIndex(index);
                                                                                    setProductSearchQuery(field.value || '');
                                                                                }}
                                                                                onChange={(e) => {
                                                                                    field.onChange(e);
                                                                                    setProductSearchQuery(e.target.value);
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                                        <Command>
                                                                            <CommandInput
                                                                                placeholder="Buscar produto..."
                                                                                value={productSearchQuery}
                                                                                onValueChange={setProductSearchQuery}
                                                                            />
                                                                            <CommandList>
                                                                                <CommandEmpty>
                                                                                    <div className='p-4 text-sm text-center'>
                                                                                        <p>Nenhum produto encontrado.</p>
                                                                                        <Button variant="link" type="button" onClick={() => setProductModalOpen(true)}>Cadastrar Novo Produto</Button>
                                                                                    </div>
                                                                                </CommandEmpty>
                                                                                <CommandGroup>
                                                                                    {filteredProducts.map((product) => (
                                                                                        <CommandItem
                                                                                            key={product.id}
                                                                                            onSelect={() => {
                                                                                                handleProductSelect(product, index);
                                                                                                setActiveInputIndex(null); 
                                                                                            }}
                                                                                        >
                                                                                            {product.codigo} - {product.descricao}
                                                                                        </CommandItem>
                                                                                    ))}
                                                                                </CommandGroup>
                                                                            </CommandList>
                                                                        </Command>
                                                                    </PopoverContent>
                                                                </Popover>
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
                            <CardFooter className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={handleCancel}>Cancelar</Button>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? "Salvando..." : (editingId ? 'Atualizar Devolução' : 'Salvar Devolução')}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            </div>

            <Dialog open={isProductModalOpen} onOpenChange={setProductModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cadastrar Novo Produto</DialogTitle>
                    </DialogHeader>
                    <ProductForm onSave={handleProductSaved} />
                </DialogContent>
            </Dialog>
        </>
    );
}

    