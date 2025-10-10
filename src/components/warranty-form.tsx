
'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, PlusCircle, Upload, X as XIcon, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';


import type { Warranty, Person, Supplier, Product } from '@/lib/types';
import * as db from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import SupplierForm from './supplier-form';
import PersonForm from './person-form';
import { Combobox } from './ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import ProductForm from './product-form';


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
  status: z.enum(['Em análise', 'Aprovada', 'Recusada', 'Paga']).optional(),
  loteId: z.number().nullable().optional(),
  photos: z.array(z.string()).optional(),
  dataRegistro: z.string().optional(),
  marca: z.string().optional(),
  referencia: z.string().optional(),
});

type WarrantyFormValues = z.infer<typeof formSchema>;

interface WarrantyFormProps {
  selectedWarranty: Warranty | null;
  onSave: (data: Warranty) => Promise<void>;
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
  status: 'Em análise',
  loteId: null,
  photos: [],
  marca: '',
  referencia: '',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function WarrantyForm({ selectedWarranty, onSave, onClear, isModal = false, isClone = false }: WarrantyFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [persons, setPersons] = useState<Person[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
    const [isPersonModalOpen, setPersonModalOpen] = useState(false);
    const [isProductModalOpen, setProductModalOpen] = useState(false);
    
    const [productSearch, setProductSearch] = useState('');
    const [isProductPopoverOpen, setProductPopoverOpen] = useState(false);
    
    const { toast } = useToast();


    const form = useForm<WarrantyFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: selectedWarranty ? {
            ...selectedWarranty,
            quantidade: selectedWarranty.quantidade ?? 1,
            status: selectedWarranty.status ?? 'Em análise',
            photos: selectedWarranty.photos ?? [],
        } : defaultValues,
    });
    
    const { watch, setValue } = form;
    const photos = watch('photos', []);


    const { isSubmitting } = form.formState;

    const loadDropdownData = async () => {
        const [allPersons, allSuppliers, allProducts] = await Promise.all([
            db.getAllPersons(),
            db.getAllSuppliers(),
            db.getAllProducts()
        ]);
        setPersons(allPersons.sort((a, b) => a.nome.localeCompare(b.nome)));
        setSuppliers(allSuppliers.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia)));
        setProducts(allProducts);
    }

    useEffect(() => {
        loadDropdownData();

        const handleDataChanged = () => loadDropdownData();
        window.addEventListener('datachanged', handleDataChanged);
        return () => window.removeEventListener('datachanged', handleDataChanged);
    }, []);

    const handleSubmit = async (values: WarrantyFormValues) => {
        const dataToSave: Warranty = {
            ...values,
            id: isClone ? undefined : selectedWarranty?.id,
            quantidade: values.quantidade ?? 1,
            status: values.status ?? 'Em análise',
            photos: values.photos ?? [],
            dataRegistro: selectedWarranty?.dataRegistro && !isClone ? selectedWarranty.dataRegistro : new Date().toISOString(),
        };

        await onSave(dataToSave);
        if (!isModal && !selectedWarranty) {
            form.reset(defaultValues);
        }
    };
    
    const handleClear = () => {
        form.reset(defaultValues);
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
    
    const handleSupplierSaved = (newSupplier: Supplier) => {
        // No need to reload all data, just update the state
        setSuppliers(prev => [...prev, newSupplier].sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia)));
        setSupplierModalOpen(false);
        form.setValue('fornecedor', newSupplier.nomeFantasia);
    };

    const handlePersonSaved = (newPerson: Person) => {
        // No need to reload all data, just update the state
        setPersons(prev => [...prev, newPerson].sort((a, b) => a.nome.localeCompare(b.nome)));
        setPersonModalOpen(false);
        if (newPerson.tipo === 'Cliente' || newPerson.tipo === 'Ambos') {
             form.setValue('cliente', newPerson.nome);
        }
        if (newPerson.tipo === 'Mecânico' || newPerson.tipo === 'Ambos') {
             form.setValue('mecanico', newPerson.nome);
        }
    };

    const handleProductSaved = (newProduct: Product) => {
        setProducts(prev => [...prev, newProduct]);
        setProductModalOpen(false);
        handleProductSelect(newProduct);
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
                    description: error.message,
                    variant: 'destructive',
                });
            });
        
        if(event.target) event.target.value = '';
    };

    const removePhoto = (index: number) => {
        const currentPhotos = form.getValues('photos') || [];
        const newPhotos = [...currentPhotos];
        newPhotos.splice(index, 1);
        setValue('photos', newPhotos, { shouldValidate: true });
    };

    const filteredProducts = productSearch 
        ? products.filter(p => 
            p.codigo.toLowerCase().includes(productSearch.toLowerCase()) || 
            p.descricao.toLowerCase().includes(productSearch.toLowerCase())
        ).slice(0, 5) // Limit results for performance
        : [];

    const clients = persons.filter(p => p.tipo === 'Cliente' || p.tipo === 'Ambos');
    const mechanics = persons.filter(p => p.tipo === 'Mecânico' || p.tipo === 'Ambos');

    const supplierOptions = suppliers.map(s => ({ value: s.nomeFantasia, label: s.nomeFantasia }));
    const clientOptions = clients.map(c => ({ value: c.nome, label: c.nome }));
    const mechanicOptions = mechanics.map(m => ({ value: m.nome, label: m.nome }));

    const innerFormContent = (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} onKeyDown={handleKeyDown} ref={formRef}>
            <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground">Informações do Produto e Defeito</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField name="codigo" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Código</FormLabel>
                                <Popover open={isProductPopoverOpen} onOpenChange={setProductPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Input 
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    setProductSearch(e.target.value);
                                                    if (e.target.value) {
                                                        setProductPopoverOpen(true);
                                                    } else {
                                                        setProductPopoverOpen(false);
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Buscar produto..." value={productSearch} onValueChange={setProductSearch} />
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
                                                            onSelect={() => handleProductSelect(product)}
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
                        )} />
                        <FormField name="descricao" control={form.control} render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel>Descrição</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                                            <Combobox
                                            options={supplierOptions}
                                            value={field.value ?? ''}
                                            onChange={field.onChange}
                                            placeholder="Selecione um fornecedor"
                                            searchPlaceholder="Buscar fornecedor..."
                                            notFoundMessage="Nenhum fornecedor encontrado."
                                            className="w-full"
                                        />
                                        <Dialog open={isSupplierModalOpen} onOpenChange={setSupplierModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="icon" className="flex-shrink-0">
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>Cadastrar Novo Fornecedor</DialogTitle>
                                                </DialogHeader>
                                                <SupplierForm onSave={handleSupplierSaved} isModal />
                                            </DialogContent>
                                        </Dialog>
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

                <div className="space-y-4">
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
                                        />
                                            <Dialog open={isPersonModalOpen} onOpenChange={setPersonModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="icon" className="flex-shrink-0">
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>Cadastrar Novo Cliente/Mecânico</DialogTitle>
                                                </DialogHeader>
                                                <PersonForm onSave={handlePersonSaved} onClear={() => {}} />
                                            </DialogContent>
                                        </Dialog>
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
                                        />
                                        <Dialog open={isPersonModalOpen} onOpenChange={setPersonModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="icon" className="flex-shrink-0">
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                    <DialogHeader>
                                                    <DialogTitle>Cadastrar Novo Cliente/Mecânico</DialogTitle>
                                                    </DialogHeader>
                                                    <PersonForm onSave={handlePersonSaved} onClear={() => {}} />
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField name="requisicaoVenda" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Requisição Venda</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                                            <SelectValue placeholder="Selecione um status" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Em análise">Em análise</SelectItem>
                                            <SelectItem value="Aprovada">Aprovada</SelectItem>
                                            <SelectItem value="Recusada">Recusada</SelectItem>
                                            <SelectItem value="Paga">Paga</SelectItem>
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
            <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClear}>Limpar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {selectedWarranty && !isClone ? 'Atualizar' : 'Salvar'}
                </Button>
            </CardFooter>
        </form>
         <Dialog open={isProductModalOpen} onOpenChange={setProductModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cadastrar Novo Produto</DialogTitle>
                </DialogHeader>
                <ProductForm onSave={handleProductSaved} />
            </DialogContent>
        </Dialog>
    </Form>
    );

    if (isModal) {
      return <div>{innerFormContent}</div>;
    }

    return (
      <Card className="w-full shadow-lg">
          <CardHeader>
              <CardTitle>{selectedWarranty ? (isClone ? 'Clonar Garantia' : 'Editar Garantia') : 'Cadastrar Garantia'}</CardTitle>
              <CardDescription>Preencha os detalhes da garantia abaixo. Use &quot;Enter&quot; para pular para o próximo campo.</CardDescription>
          </CardHeader>
          {innerFormContent}
      </Card>
    );
}

    
