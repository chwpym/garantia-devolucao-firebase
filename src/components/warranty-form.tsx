
'use client';

import { useRef, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, X as XIcon, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';


import type { Warranty, Person, Supplier, Product, WarrantyStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { smartSearch } from '@/lib/search-utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from './ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { useAppStore } from '@/store/app-store';
import { WARRANTY_STATUSES } from '@/lib/types';
import { QuickRegisterDialog } from './quick-register-dialog';
import ComboboxProduct from '@/components/combobox-product';
import ComboboxSearch from '@/components/combobox-search';
import ComboboxPerson from '@/components/combobox-person';


const formSchema = z.object({
    id: z.number().optional(),
    codigo: z.string().optional(),
    descricao: z.string().optional(),
    fornecedor: z.string().optional(),
    quantidade: z.coerce.number().min(0).optional(),
    defeito: z.string().optional(),
    requisicaoVenda: z.string().optional(),
    requisicoesGarantia: z.string().optional(),
    nfCompra: z.string().optional(),
    valorCompra: z.string().optional(),
    cliente: z.string().optional(),
    mecanico: z.string().optional(),
    notaFiscalSaida: z.string().optional(),
    notaFiscalRetorno: z.string().optional(),
    observacao: z.string().optional(),
    status: z.string().optional(),
    loteId: z.number().nullable().optional(),
    photos: z.array(z.string()).optional(),
    dataRegistro: z.string().optional(),
    marca: z.string().optional(),
    referencia: z.string().optional(),
});

type WarrantyFormValues = z.infer<typeof formSchema>;

interface WarrantyFormProps {
    selectedWarranty: Warranty | null;
    onSave: (data: Warranty, shouldNavigate: boolean) => Promise<void>;
    onClear: () => void;
    isModal?: boolean;
    isClone?: boolean;
}

const defaultValues: WarrantyFormValues = {
    codigo: '',
    descricao: '',
    fornecedor: '',
    quantidade: 1,
    defeito: '',
    requisicaoVenda: '',
    requisicoesGarantia: '',
    nfCompra: '',
    valorCompra: '',
    cliente: '',
    mecanico: '',
    notaFiscalSaida: '',
    notaFiscalRetorno: '',
    observacao: '',
    status: '',
    loteId: null,
    photos: [],
    marca: '',
    referencia: '',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function WarrantyForm({ selectedWarranty, onSave, onClear, isModal = false, isClone = false }: WarrantyFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { products, persons, suppliers, statuses } = useAppStore();

    const [quickRegisterType, setQuickRegisterType] = useState<'product' | 'supplier' | 'person' | null>(null);
    const [isQuickRegisterOpen, setQuickRegisterOpen] = useState(false);

    const [productSearch, setProductSearch] = useState('');
    const [isProductPopoverOpen, setProductPopoverOpen] = useState(false);

    const { toast } = useToast();
    const goBack = useAppStore(state => state.goBack);


    const form = useForm<WarrantyFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: selectedWarranty ? {
            ...selectedWarranty,
            quantidade: selectedWarranty.quantidade ?? 1,
            status: selectedWarranty.status ?? 'Aguardando Envio',
            photos: selectedWarranty.photos ?? [],
        } : defaultValues,
    });

    const { watch, setValue } = form;
    const photos = watch('photos', []);


    const { isSubmitting } = form.formState;

    const [shouldNavigate, setShouldNavigate] = useState(true);

    const handleSubmit = async (values: WarrantyFormValues) => {
        const dataToSave: Warranty = {
            ...values,
            id: isClone ? undefined : selectedWarranty?.id,
            quantidade: values.quantidade ?? 1,
            status: values.status as WarrantyStatus,
            photos: values.photos ?? [],
            dataRegistro: new Date().toISOString(), // Always record current time as the last action timestamp
        };

        await onSave(dataToSave, shouldNavigate);

        if (!shouldNavigate) {
            // Limpa o formulário completo para novo lançamento, evitando confusão
            const currentObs = form.getValues('observacao');
            form.reset(defaultValues);
            if (currentObs) form.setValue('observacao', currentObs);
            
            if (fileInputRef.current) fileInputRef.current.value = '';
            toast({
                title: 'Pronto para mais um!',
                description: 'O formulário foi limpo para o próximo lançamento.',
            });
        }
        
        window.dispatchEvent(new CustomEvent('datachanged'));
    };

    const handleClear = () => {
        if (selectedWarranty) {
            goBack(); // If we were editing, go back
        } else {
            form.reset(defaultValues); // If it's a new form, just clear it
        }
        onClear();
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.target instanceof HTMLElement && !(e.target instanceof HTMLTextAreaElement)) {
            e.preventDefault();
            const formElements = Array.from(
                formRef.current?.querySelectorAll('input, button, select, textarea') || []
            ) as HTMLElement[];

            const focusable = formElements.filter(el => !el.hasAttribute('disabled') && !el.hasAttribute('readonly') && el.offsetParent !== null);
            const currentIndex = focusable.indexOf(e.target as HTMLElement);
            const nextElement = focusable[currentIndex + 1] as HTMLElement | undefined;

            nextElement?.focus();
        }
    };

    const handleProductSaved = (newProduct: Product) => {
        handleProductSelect(newProduct);
    };

    const handleSupplierSaved = (newSupplier: Supplier) => {
        form.setValue('fornecedor', newSupplier.nomeFantasia);
    };

    const handlePersonSaved = (newPerson: Person) => {
        if (newPerson.tipo === 'CLIENTE' || newPerson.tipo === 'AMBOS') {
            form.setValue('cliente', newPerson.nome);
        }
        if (newPerson.tipo === 'MECÂNICO' || newPerson.tipo === 'AMBOS') {
            form.setValue('mecanico', newPerson.nome);
        }
    };

    const handleProductSelect = (product: Product) => {
        form.setValue('codigo', product.codigo);
        form.setValue('descricao', product.descricao);
        form.setValue('marca', product.marca);
        form.setValue('referencia', product.referencia);
        setProductPopoverOpen(false);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const currentPhotos = form.getValues('photos') || [];

        const filePromises = Array.from(files).map(file => {
            return new Promise<string>((resolve, reject) => {
                if (file.size > MAX_FILE_SIZE) {
                    return reject(new Error(`O arquivo ${file.name} é muito grande (maior que 5MB).`));
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve(e.target?.result as string);
                };
                reader.onerror = (error) => {
                    reject(error);
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(filePromises)
            .then(base64Files => {
                setValue('photos', [...currentPhotos, ...base64Files], { shouldValidate: true });
            })
            .catch(error => {
                toast({
                    title: 'Erro ao carregar imagem',
                    description: (error as Error).message,
                    variant: 'destructive',
                });
            });

        if (event.target) event.target.value = '';
    };

    const removePhoto = (index: number) => {
        const currentPhotos = form.getValues('photos') || [];
        const newPhotos = [...currentPhotos];
        newPhotos.splice(index, 1);
        setValue('photos', newPhotos, { shouldValidate: true });
    };

    const filteredProducts = productSearch
        ? products.filter(p => smartSearch(p, productSearch, ['codigo', 'descricao', 'referencia', 'marca']))
            .slice(0, 5)
        : [];


    const clientsList = useMemo(() => {
        const filtered = persons.filter(p => {
            if (!p.tipo) return true;
            const type = p.tipo.toUpperCase();
            return type === 'CLIENTE' || type === 'AMBOS';
        });
        const nameCounts = new Map<string, number>();
        filtered.forEach(p => nameCounts.set(p.nome, (nameCounts.get(p.nome) || 0) + 1));

        return filtered.map(p => {
            const hasCollision = (nameCounts.get(p.nome) || 0) > 1;
            const docFragment = p.cpfCnpj ? ` (${p.cpfCnpj.slice(-4)})` : '';
            const displayName = hasCollision ? `${p.nome}${docFragment}` : p.nome;
            return { ...p, displayName };
        });
    }, [persons]);

    const clientOptions = useMemo(() => clientsList.map(c => ({
        value: c.displayName,
        label: c.displayName,
        key: `p-${c.id}`,
        keywords: [c.nome, c.razaoSocial, c.nomeFantasia, c.cpfCnpj].filter(Boolean) as string[]
    })), [clientsList]);

    const supplierOptions = useMemo(() => suppliers.map(s => ({
        value: s.nomeFantasia,
        label: s.nomeFantasia,
        key: `s-${s.id}`,
        keywords: [s.razaoSocial, s.cnpj].filter(Boolean) as string[]
    })), [suppliers]);

    const mechanicsList = useMemo(() => {
        const filtered = persons.filter(p => {
            if (!p.tipo) return true;
            const type = p.tipo.toUpperCase();
            return type === 'MECÂNICO' || type === 'MECANICO' || type === 'AMBOS';
        });
        const nameCounts = new Map<string, number>();
        filtered.forEach(p => nameCounts.set(p.nome, (nameCounts.get(p.nome) || 0) + 1));

        return filtered.map(p => {
            const hasCollision = (nameCounts.get(p.nome) || 0) > 1;
            const docFragment = p.cpfCnpj ? ` (${p.cpfCnpj.slice(-4)})` : '';
            const displayName = hasCollision ? `${p.nome}${docFragment}` : p.nome;
            return { ...p, displayName };
        });
    }, [persons]);

    const mechanicOptions = useMemo(() => mechanicsList.map(m => ({
        value: m.displayName,
        label: m.displayName,
        key: `m-${m.id}`,
        keywords: [m.nome, m.razaoSocial, m.nomeFantasia, m.cpfCnpj].filter(Boolean) as string[]
    })), [mechanicsList]);

    // Filter dynamic statuses for Garantia
    const dynamicStatuses = statuses
        .filter(s => s.aplicavelEm.includes('garantia'))
        .map(s => s.nome);
    
    // Merge with hardcoded defaults to ensure fallbacks and unique entries
    const availableStatuses = Array.from(new Set([...WARRANTY_STATUSES, ...dynamicStatuses]));

    const innerFormContent = (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} onKeyDown={handleKeyDown} ref={formRef} className="flex-1 flex flex-col min-h-0">
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground">Informações do Produto e Defeito</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField name="codigo" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Código</FormLabel>
                                    <ComboboxProduct
                                        value={field.value}
                                        onProductSelect={(product) => handleProductSelect(product)}
                                        onInputChange={field.onChange}
                                        onAddNew={() => {
                                            setQuickRegisterType('product');
                                            setQuickRegisterOpen(true);
                                        }}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField name="descricao" control={form.control} render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            readOnly 
                                            tabIndex={-1} 
                                            className="bg-muted/50 cursor-not-allowed text-muted-foreground" 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField name="quantidade" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField
                                control={form.control}
                                name="fornecedor"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2 flex flex-col">
                                        <FormLabel>Fornecedor</FormLabel>
                                        <div className="flex items-center gap-2">
                                            <ComboboxPerson
                                                options={supplierOptions}
                                                value={field.value ?? ''}
                                                onPersonSelect={field.onChange}
                                                onInputChange={field.onChange}
                                                placeholder="Selecione um fornecedor"
                                                searchPlaceholder="Buscar fornecedor..."
                                                addEntityLabel="Novo Fornecedor"
                                                onAddNew={() => {
                                                    setQuickRegisterType('supplier');
                                                    setQuickRegisterOpen(true);
                                                }}
                                            />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField name="defeito" control={form.control} render={({ field }) => (
                                <FormItem className="md:col-span-2"><FormLabel>Defeito Apresentado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground">Fotos da Garantia</h3>
                        <FormField
                            control={form.control}
                            name="photos"
                            render={() => (
                                <FormItem>
                                    <FormControl>
                                        <div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload className="mr-2 h-4 w-4" />
                                                Carregar Fotos
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    {photos && photos.length > 0 && (
                                        <div className="flex flex-wrap gap-4 mt-4">
                                            {photos.map((photo, index) => (
                                                <div key={index} className="relative w-32 h-32 rounded-md overflow-hidden border">
                                                    <Image
                                                        src={photo}
                                                        alt={`Preview ${index + 1}`}
                                                        fill={true}
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-1 right-1 h-6 w-6"
                                                        onClick={() => removePhoto(index)}
                                                    >
                                                        <XIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {photos && photos.length === 0 && (
                                        <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg text-muted-foreground">
                                            <ImageIcon className="h-8 w-8 mb-2" />
                                            <p>Nenhuma foto anexada.</p>
                                            <p className="text-xs">Anexe fotos do produto, defeito ou nota fiscal.</p>
                                        </div>
                                    )}
                                </FormItem>
                            )}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-4 bg-muted/10 border-2 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-foreground">Dados Fiscais e de Venda</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField
                                control={form.control}
                                name="cliente"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2 flex flex-col">
                                        <FormLabel>Cliente</FormLabel>
                                        <div className="flex items-center gap-2">
                                            <Combobox
                                                options={clientOptions}
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                                placeholder="Selecione um cliente"
                                                searchPlaceholder="Buscar cliente..."
                                                notFoundMessage="Nenhum cliente encontrado."
                                                className="w-full"
                                                onAddClick={() => {
                                                    setQuickRegisterType('person');
                                                    setQuickRegisterOpen(true);
                                                }}
                                                addLabel="Novo Cliente/Mecânico"
                                            />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="mecanico"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2 flex flex-col">
                                        <FormLabel>Mecânico</FormLabel>
                                        <div className="flex items-center gap-2">
                                            <Combobox
                                                options={mechanicOptions}
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                                placeholder="Selecione um mecânico"
                                                searchPlaceholder="Buscar mecânico..."
                                                notFoundMessage="Nenhum mecânico encontrado."
                                                className="w-full"
                                                onAddClick={() => {
                                                    setQuickRegisterType('person');
                                                    setQuickRegisterOpen(true);
                                                }}
                                                addLabel="Novo Cliente/Mecânico"
                                            />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField name="requisicaoVenda" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel className="truncate">Condicional/Requisição</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="requisicoesGarantia" control={form.control} render={({ field }) => (
                                <FormItem className="md:col-span-3"><FormLabel>Requisições Garantia</FormLabel><FormControl><Textarea rows={1} placeholder="Separe múltiplas requisições por vírgula" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="nfCompra" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>NF Compra</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="valorCompra" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Valor Compra</FormLabel><FormControl><Input placeholder="R$ 0,00" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="notaFiscalSaida" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Nota Fiscal de Saída</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="notaFiscalRetorno" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Nota Fiscal de Retorno</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="SELECIONE O STATUS" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableStatuses.map(status => (
                                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground">Observações</h3>
                        <FormField name="observacao" control={form.control} render={({ field }) => (
                            <FormItem><FormControl><Textarea rows={2} placeholder="Adicione qualquer observação relevante aqui..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                </CardContent>
                <CardFooter className="flex-none flex justify-between items-center gap-2 py-4 border-t bg-muted/5">
                    <Button type="button" variant="ghost" onClick={handleClear} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <div className="flex gap-2">
                        {!isClone && (
                            <Button
                                type="submit"
                                variant="outline"
                                disabled={isSubmitting}
                                onClick={() => setShouldNavigate(false)}
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Salvar e Continuar
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            onClick={() => setShouldNavigate(true)}
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {selectedWarranty && !isClone ? 'Atualizar e Sair' : 'Salvar e Sair'}
                        </Button>
                    </div>
                </CardFooter>
            </form>
            <QuickRegisterDialog
                open={isQuickRegisterOpen}
                onOpenChange={setQuickRegisterOpen}
                type={quickRegisterType}
                onSuccess={(item) => {
                    if (quickRegisterType === 'product') handleProductSaved(item);
                    if (quickRegisterType === 'supplier') handleSupplierSaved(item);
                    if (quickRegisterType === 'person') handlePersonSaved(item);
                }}
            />
        </Form>
    );

    if (isModal) {
        return <div>{innerFormContent}</div>;
    }

    return (
        <Card className="w-full h-full flex flex-col shadow-sm border-0 bg-transparent lg:bg-card lg:border lg:shadow-lg">
            <CardHeader className="flex-none bg-muted/5 border-b">
                <CardTitle>{selectedWarranty ? (isClone ? 'Clonar Garantia' : 'Editar Garantia') : 'Cadastrar Garantia'}</CardTitle>
                <CardDescription>Preencha os detalhes da garantia abaixo. Use &quot;Enter&quot; para pular para o próximo campo.</CardDescription>
            </CardHeader>
            <div className="flex-1 flex flex-col min-h-0">
                {innerFormContent}
            </div>
        </Card>
    );
}
