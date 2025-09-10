'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, PlusCircle } from 'lucide-react';

import type { Warranty, Person, Supplier } from '@/lib/types';
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


const formSchema = z.object({
  codigo: z.string().optional(),
  descricao: z.string().optional(),
  fornecedor: z.string().optional(),
  quantidade: z.coerce.number().min(0).optional(),
  defeito: z.string().optional(),
  requisicoes: z.string().optional(),
  nfCompra: z.string().optional(),
  valorCompra: z.string().optional(),
  cliente: z.string().optional(),
  mecanico: z.string().optional(),
  notaFiscalSaida: z.string().optional(),
  notaFiscalRetorno: z.string().optional(),
  observacao: z.string().optional(),
  status: z.enum(['Em análise', 'Aprovada', 'Recusada', 'Paga']).optional(),
  loteId: z.number().nullable().optional(),
});

type WarrantyFormValues = z.infer<typeof formSchema>;

interface WarrantyFormProps {
  selectedWarranty: Warranty | null;
  onSave: (data: Omit<Warranty, 'id'>, id?: number) => Promise<void>;
  onClear: () => void;
  isModal?: boolean;
}

const defaultValues: WarrantyFormValues = {
  codigo: '',
  descricao: '',
  fornecedor: '',
  quantidade: 1,
  defeito: '',
  requisicoes: '',
  nfCompra: '',
  valorCompra: '',
  cliente: '',
  mecanico: '',
  notaFiscalSaida: '',
  notaFiscalRetorno: '',
  observacao: '',
  status: 'Em análise',
  loteId: null,
};

export default function WarrantyForm({ selectedWarranty, onSave, onClear, isModal = false }: WarrantyFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const [persons, setPersons] = useState<Person[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
    const [isPersonModalOpen, setPersonModalOpen] = useState(false);


    const form = useForm<WarrantyFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: selectedWarranty ? {
            ...selectedWarranty,
            quantidade: selectedWarranty.quantidade ?? 1,
            status: selectedWarranty.status ?? 'Em análise',
        } : defaultValues,
    });

    const { isSubmitting } = form.formState;

    const loadDropdownData = async () => {
        const allPersons = await db.getAllPersons();
        const allSuppliers = await db.getAllSuppliers();
        setPersons(allPersons.sort((a, b) => a.name.localeCompare(b.name)));
        setSuppliers(allSuppliers.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia)));
    }

    useEffect(() => {
        loadDropdownData();

        const handleDataChanged = () => loadDropdownData();
        window.addEventListener('datachanged', handleDataChanged);
        return () => window.removeEventListener('datachanged', handleDataChanged);
    }, []);

    useEffect(() => {
        form.reset(selectedWarranty ? {
        ...selectedWarranty,
        quantidade: selectedWarranty.quantidade ?? 1,
        status: selectedWarranty.status ?? 'Em análise',
        } : defaultValues);
    }, [selectedWarranty, form]);

    const handleSubmit = async (values: WarrantyFormValues) => {
        const dataToSave: Omit<Warranty, 'id'> = {
        ...values,
        quantidade: values.quantidade ?? 1,
        status: values.status ?? 'Em análise',
        };

        if (!selectedWarranty?.id) {
            dataToSave.dataRegistro = new Date().toISOString();
        } else {
            dataToSave.dataRegistro = selectedWarranty.dataRegistro;
        }

        await onSave(dataToSave, selectedWarranty?.id);
        if (!isModal) {
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
        loadDropdownData();
        setSupplierModalOpen(false);
        form.setValue('fornecedor', newSupplier.nomeFantasia);
    };

    const handlePersonSaved = (newPerson: Person) => {
        loadDropdownData();
        setPersonModalOpen(false);
        if (newPerson.type === 'Cliente' || newPerson.type === 'Ambos') {
             form.setValue('cliente', newPerson.name);
        }
        if (newPerson.type === 'Mecânico' || newPerson.type === 'Ambos') {
             form.setValue('mecanico', newPerson.name);
        }
    };

    const clients = persons.filter(p => p.type === 'Cliente' || p.type === 'Ambos');
    const mechanics = persons.filter(p => p.type === 'Mecânico' || p.type === 'Ambos');

    const supplierOptions = suppliers.map(s => ({ value: s.nomeFantasia, label: s.nomeFantasia }));
    const clientOptions = clients.map(c => ({ value: c.name, label: c.name }));
    const mechanicOptions = mechanics.map(m => ({ value: m.name, label: m.name }));

    const FormWrapper = isModal ? 'div' : Card;
    const formWrapperProps = isModal ? {} : { className: "w-full shadow-lg" };

    return (
        <FormWrapper {...formWrapperProps}>
        {!isModal && (
            <CardHeader>
                <CardTitle>{selectedWarranty ? 'Editar Garantia' : 'Cadastrar Garantia'}</CardTitle>
                <CardDescription>Preencha os detalhes da garantia abaixo. Use &quot;Enter&quot; para pular para o próximo campo.</CardDescription>
            </CardHeader>
        )}
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} onKeyDown={handleKeyDown} ref={formRef}>
            <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Informações do Produto e Defeito</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField name="codigo" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Código</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Cadastrar Novo Fornecedor</DialogTitle>
                                            </DialogHeader>
                                            <SupplierForm onSave={handleSupplierSaved} />
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
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Cadastrar Novo Cliente/Mecânico</DialogTitle>
                                            </DialogHeader>
                                            <PersonForm onSave={handlePersonSaved} />
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
                                        <DialogContent>
                                             <DialogHeader>
                                                <DialogTitle>Cadastrar Novo Cliente/Mecânico</DialogTitle>
                                            </DialogHeader>
                                            <PersonForm onSave={handlePersonSaved} />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField name="nfCompra" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>NF Compra</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="valorCompra" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Valor Compra</FormLabel><FormControl><Input placeholder="R$ 0,00" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField name="requisicoes" control={form.control} render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Requisições</FormLabel><FormControl><Textarea rows={1} placeholder="Separe múltiplas requisições por vírgula" {...field} /></FormControl><FormMessage /></FormItem>
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
                {selectedWarranty ? 'Atualizar' : 'Salvar'}
                </Button>
            </CardFooter>
            </form>
        </Form>
        </FormWrapper>
    );
}
